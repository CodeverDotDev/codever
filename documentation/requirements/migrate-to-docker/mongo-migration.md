# MongoDB Migration: 3.2 → 5.0 (Dockerized with Host Volume)

> **Version rationale (infrastructure-first, no code changes):** MongoDB **5.0** is the highest
> server version officially supported by the app's pinned `mongoose ^5.13` — going to Mongo 6/7
> would require upgrading to mongoose 7/8 (code changes), which is **deferred to the later code
> phase** (see [migration-plan.md](migration-plan.md), Phase 10).
> ⚠️ `mongo:5.0+` images require a CPU with **AVX** — verify with `grep avx /proc/cpuinfo` on the
> new Linode; if unavailable, fall back to `mongo:4.4` (also supported by mongoose 5).

## Current State

| Component | Detail |
|---|---|
| MongoDB version | **3.2.11** (bare-metal on Ubuntu 16 in production; `mongo:3.4` Docker image in dev) |
| Database name | `dev-bookmarks` |
| Auth user | `bookmarks` (readWrite role on `dev-bookmarks`) |
| Admin user | `mongoadmin` (root) |
| Collections | `bookmarks`, `snippets`, `notes`, `users`, `feedbacks` |
| Mongoose driver | `mongoose@5.13.23` (uses `mongodb@3.7.4` driver underneath) |
| Connection string | `mongodb://bookmarks:<pwd>@<host>:27017/dev-bookmarks` |
| Indexes | 3 text-search indexes + 1 unique compound index (see below) |

### Existing Indexes (from `init-mongo.js`)

| Collection | Index Name | Type | Fields |
|---|---|---|---|
| `bookmarks` | `full_text_search` | Text (weighted) | name(13), location(8), description(5), tags(21), sourceCodeURL(3) |
| `bookmarks` | `unique_user_and_location` | Unique compound | {location: 1, userId: 1} |
| `snippets` | (unnamed) | Regular | {userId: 1} |
| `snippets` | `full_text_search` | Text (weighted) | title(8), tags(13), codeSnippets.comment(3), codeSnippets.code(3), reference(1) |
| `notes` | `notes_full_text_search` | Text (weighted) | title(13), reference(3), content(5), tags(21) |

---

## Target State

| Component | Detail |
|---|---|
| MongoDB version | **`mongo:5.0`** (Docker container) — fallback `mongo:4.4` if no AVX |
| Data storage | Named Docker volume **or** bind-mount to host directory |
| Mongoose driver | **`mongoose@5.13.x` — UNCHANGED** (MongoDB 5.0 is within its support matrix) |
| `mongodb` Node.js driver | `3.7.x` (bundled with mongoose 5) — unchanged |

---

## Docker Volumes: How They Work for MongoDB Data

### Option A: Named Docker Volume (recommended for simplicity)

Docker manages the storage location on the host. The data lives somewhere under `/var/lib/docker/volumes/`.

```yaml
volumes:
  mongo_data:
    driver: local

services:
  mongo:
    image: mongo:5.0
    volumes:
      - mongo_data:/data/db
```

**Pros:** Docker handles permissions, easy to reference in compose, portable.
**Cons:** Location is abstracted away (harder to find on disk).

To inspect where it actually lives on disk:
```bash
docker volume inspect codever_mongo_data
# Returns "Mountpoint": "/var/lib/docker/volumes/codever_mongo_data/_data"
```

### Option B: Bind-mount to a specific host directory (recommended for production)

You choose exactly where on the server the data lives. This is better for production because:
- You know exactly where the data is for backups
- You can put it on a specific disk/partition
- You can set up cron-based file system snapshots

```yaml
services:
  mongo:
    image: mongo:5.0
    volumes:
      - /data/codever/mongodb:/data/db
    user: "999:999"   # mongodb user inside the container
```

**Setup on the server:**
```bash
# Create the directory on your server
sudo mkdir -p /data/codever/mongodb

# The mongo container runs as uid 999 (mongodb user)
# Set ownership so the container can write
sudo chown -R 999:999 /data/codever/mongodb

# Optional: restrict permissions
sudo chmod 700 /data/codever/mongodb
```

> **Recommendation for production:** Use **Option B** (bind-mount) with a dedicated directory like `/data/codever/mongodb`. This way you always know exactly where your data is, and you can set up file-level backups, LVM snapshots, or rsync directly on that path.

### Option C: Bind-mount with a separate backup volume

For extra safety, keep the data on one disk and backups on another:

```bash
# Data directory (ideally on SSD)
sudo mkdir -p /data/codever/mongodb

# Backup directory (can be on a separate/cheaper disk)
sudo mkdir -p /backups/codever/mongodb

sudo chown -R 999:999 /data/codever/mongodb
```

---

## Step-by-step Migration

### Step 1 — Dump data from production MongoDB 3.2

On your current Ubuntu 16 server where MongoDB 3.2.11 is running bare-metal:

```bash
# Create a backup directory
mkdir -p ~/mongo-migration-backup

# Dump the entire dev-bookmarks database
# This works with any source version and produces portable BSON files
mongodump \
  --host localhost \
  --port 27017 \
  --username bookmarks \
  --password "YOUR_PRODUCTION_PASSWORD" \
  --authenticationDatabase dev-bookmarks \
  --db dev-bookmarks \
  --out ~/mongo-migration-backup/

# Verify the dump
ls -la ~/mongo-migration-backup/dev-bookmarks/
# You should see: bookmarks.bson, bookmarks.metadata.json,
#                  snippets.bson, snippets.metadata.json,
#                  notes.bson, notes.metadata.json,
#                  users.bson, users.metadata.json,
#                  feedbacks.bson, feedbacks.metadata.json
```

Also dump the user credentials separately:

```bash
mongodump \
  --host localhost \
  --port 27017 \
  --username mongoadmin \
  --password "YOUR_ADMIN_PASSWORD" \
  --authenticationDatabase admin \
  --db admin \
  --collection system.users \
  --out ~/mongo-migration-backup/
```

> **Important:** `mongodump`/`mongorestore` output is version-independent BSON. You can dump from 3.2 and restore directly into 5.0 — no need to step through intermediate versions (3.4→3.6→4.0→…). The stepping-through-versions requirement (with `featureCompatibilityVersion` bumps) only applies to **in-place upgrades** (reusing the same data directory), which we are NOT doing.

### Step 2 — Copy the dump to the new server

```bash
# From your local machine or old server
scp -r ~/mongo-migration-backup/ user@new-server:/tmp/mongo-migration-backup/
```

Or if both servers can reach each other:
```bash
rsync -avz ~/mongo-migration-backup/ user@new-server:/tmp/mongo-migration-backup/
```

### Step 3 — Prepare the new server directories

On the **new server** (Ubuntu 22.04/24.04):

```bash
# MongoDB data directory
sudo mkdir -p /data/codever/mongodb
sudo chown -R 999:999 /data/codever/mongodb

# MongoDB backup directory
sudo mkdir -p /backups/codever/mongodb
sudo chown -R 999:999 /backups/codever/mongodb

# Logs (optional, if you want mongo logs on host)
sudo mkdir -p /var/log/codever/mongodb
sudo chown -R 999:999 /var/log/codever/mongodb
```

### Step 4 — Start MongoDB 5.0 container (empty, for initial setup)

Add this to your `docker-compose.prod.yml` (full stack in [docker-compose-prod.md](docker-compose-prod.md)):

```yaml
volumes:
  # If using named volume instead of bind mount:
  # mongo_data:
  #   driver: local
  postgres_data:
    driver: local

networks:
  backend:

services:
  mongo:
    image: mongo:5.0
    container_name: codever-mongo
    networks:
      - backend
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: dev-bookmarks
      MONGO_INITDB_ROOT_USERNAME: mongoadmin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ADMIN_PASSWORD:-change_me_in_production}
    volumes:
      # Bind-mount to host directory (Option B)
      - /data/codever/mongodb:/data/db
      # Init script only runs on first start (empty data dir)
      - ./docker-compose-setup/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
    command: ["mongod", "--auth", "--bind_ip_all"]
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')", "-u", "mongoadmin", "-p", "${MONGO_ADMIN_PASSWORD:-change_me_in_production}", "--authenticationDatabase", "admin"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
```

> **Note:** MongoDB 5.0 images ship `mongosh` (the init entrypoint uses it); the legacy `mongo` shell is deprecated.

Start it up:
```bash
docker compose -f docker-compose.prod.yml up -d mongo
```

### Step 5 — Update `init-mongo.js` for mongosh compatibility

The existing `init-mongo.js` uses `db.bookmarks.insert()` which is deprecated (and removed in `mongosh`). Update to use `insertMany()`:

```javascript
// db.bookmarks.insert([...])    // ❌ Deprecated / removed in mongosh
db.bookmarks.insertMany([...])   // ✅ Works in all versions
```

Also, `db.auth()` is no longer needed in init scripts because `MONGO_INITDB_*` env vars handle authentication. The init script runs as the root user automatically.

Updated `init-mongo.js` header:

```javascript
// User creation — runs against MONGO_INITDB_DATABASE (dev-bookmarks)
db.createUser({
  user: "bookmarks",
  pwd: "YOUR_SECURE_PASSWORD",
  roles: [{ role: "readWrite", db: "dev-bookmarks" }]
});

// No need for db.auth() — init scripts run as root automatically

// Insert initial bookmarks (only needed for fresh dev setup, NOT for production migration)
// db.bookmarks.insertMany([...]);

// Indexes — ALWAYS create these (they're idempotent)
db.bookmarks.createIndex(
  { name: "text", location: "text", description: "text", tags: "text", sourceCodeURL: "text" },
  { weights: { name: 13, location: 8, description: 5, tags: 21, sourceCodeURL: 3 },
    name: "full_text_search", default_language: "none", language_override: "none" }
);

db.bookmarks.createIndex(
  { location: 1, userId: 1 },
  { unique: true, name: "unique_user_and_location" }
);

db.snippets.createIndex({ userId: 1 });

db.snippets.createIndex(
  { title: "text", tags: "text", "codeSnippets.comment": "text", "codeSnippets.code": "text", reference: "text" },
  { weights: { title: 8, tags: 13, "codeSnippets.comment": 3, "codeSnippets.code": 3, reference: 1 },
    name: "full_text_search", default_language: "none", language_override: "none" }
);

db.notes.createIndex(
  { title: "text", reference: "text", content: "text", tags: "text" },
  { weights: { title: 13, reference: 3, content: 5, tags: 21 },
    name: "notes_full_text_search", default_language: "none", language_override: "none" }
);
```

### Step 6 — Restore the dump into MongoDB 5.0

```bash
# Copy the dump into the running container
docker cp /tmp/mongo-migration-backup/dev-bookmarks codever-mongo:/tmp/dev-bookmarks-dump

# Restore into the container
docker exec codever-mongo mongorestore \
  --host localhost \
  --port 27017 \
  --username mongoadmin \
  --password "YOUR_ADMIN_PASSWORD" \
  --authenticationDatabase admin \
  --db dev-bookmarks \
  --drop \
  /tmp/dev-bookmarks-dump

# The --drop flag replaces existing collections (safe for migration)
```

Alternatively, use `mongorestore` from outside the container if port 27017 is exposed:
```bash
mongorestore \
  --host new-server \
  --port 27017 \
  --username mongoadmin \
  --password "YOUR_ADMIN_PASSWORD" \
  --authenticationDatabase admin \
  --db dev-bookmarks \
  --drop \
  /tmp/mongo-migration-backup/dev-bookmarks/
```

### Step 7 — Verify the restored data

```bash
# Connect to the container with mongosh
docker exec -it codever-mongo mongosh \
  -u bookmarks -p "YOUR_PASSWORD" \
  --authenticationDatabase dev-bookmarks \
  dev-bookmarks

# Check collections exist
show collections
# Expected: bookmarks, feedbacks, notes, snippets, users

# Check document counts
db.bookmarks.countDocuments()
db.snippets.countDocuments()
db.notes.countDocuments()
db.users.countDocuments()

# Verify indexes were restored
db.bookmarks.getIndexes()
db.snippets.getIndexes()
db.notes.getIndexes()

# Test a full-text search (this is the most critical query)
db.bookmarks.find({ $text: { $search: "codever" } }).limit(5)

# Test the unique index
db.bookmarks.getIndexes().filter(i => i.name === "unique_user_and_location")
```

### Step 8 — Mongoose: NO upgrade in this phase

**`mongoose@5.13.x` stays as-is.** MongoDB 5.0 was chosen precisely so the pinned mongoose 5 driver
keeps working **without any application code changes** (guiding principle of
[migration-plan.md](migration-plan.md)).

> **Deferred to the code-modernization phase (Phase 10):** upgrading to `mongoose@7/8` (which
> unlocks MongoDB 6/7). When that phase starts, plan for these known breaking changes:
>
> 1. Removed connect options (`useNewUrlParser`, `useUnifiedTopology`, `useFindAndModify`) in `app.js`
> 2. `findOneAndUpdate()`: `returnDocument: 'after'` replaces `new: true`
> 3. `remove()` removed — replace with `deleteOne()` / `deleteMany()`
> 4. Callback-based queries removed — everything must be `await`/`.then()`
> 5. Stricter `Schema.Types.ObjectId` validation
>
> Quick scan for affected call sites when the time comes:
> ```bash
> cd apps/codever-api
> grep -rn "\.remove(" src/
> grep -rn "useNewUrlParser\|useUnifiedTopology\|useFindAndModify" src/
> grep -rn "{ new: true }" src/
> grep -rn "callback\|function(err" src/
> ```

### Step 9 — Update environment variables for Docker

The connection inside Docker uses the service name `mongo` instead of `localhost`:

```yaml
# In docker-compose.prod.yml, codever-api service:
environment:
  MONGODB_BOOKMARKS_USERNAME: bookmarks
  MONGODB_BOOKMARKS_PASSWORD: ${MONGO_BOOKMARKS_PASSWORD:-change_me}
  MONGODB_BOOKMARKS_COLLECTION: dev-bookmarks
  MONGODB_HOST: mongo          # <-- Docker service name, not localhost
  MONGODB_PORT: "27017"
```

The connection string in `app.js` already builds from env vars, so no code change needed:
```javascript
// This line in app.js already works:
const mongoUrl = `mongodb://${mongoUserName}:${mongoUserPwd}@${mongoHost}:${mongoPort}/${mongoBookmarksCollectionName}`;
```

---

## Production Backup Strategy

### Automated daily backups with `mongodump`

Create a backup script on the host server:

```bash
#!/bin/bash
# /usr/local/bin/codever-mongo-backup.sh

BACKUP_DIR="/backups/codever/mongodb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/${TIMESTAMP}"
RETENTION_DAYS=30

# Create backup
docker exec codever-mongo mongodump \
  --username mongoadmin \
  --password "${MONGO_ADMIN_PASSWORD}" \
  --authenticationDatabase admin \
  --db dev-bookmarks \
  --out /tmp/backup-${TIMESTAMP}

# Copy out of container
docker cp codever-mongo:/tmp/backup-${TIMESTAMP} ${BACKUP_PATH}

# Clean up inside container
docker exec codever-mongo rm -rf /tmp/backup-${TIMESTAMP}

# Compress
tar -czf ${BACKUP_PATH}.tar.gz -C ${BACKUP_DIR} ${TIMESTAMP}
rm -rf ${BACKUP_PATH}

# Delete backups older than retention period
find ${BACKUP_DIR} -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete

echo "$(date): Backup completed → ${BACKUP_PATH}.tar.gz"
```

Add to cron:
```bash
sudo chmod +x /usr/local/bin/codever-mongo-backup.sh

# Run daily at 3:00 AM
sudo crontab -e
# Add: 0 3 * * * /usr/local/bin/codever-mongo-backup.sh >> /var/log/codever/mongodb/backup.log 2>&1
```

---

## Migration Checklist

- [ ] AVX support verified on the new server (`grep avx /proc/cpuinfo`) — else use `mongo:4.4`
- [ ] `mongodump` from production MongoDB 3.2.11 completed
- [ ] Dump files transferred to new server
- [ ] Host directories created with correct permissions (`/data/codever/mongodb`)
- [ ] `init-mongo.js` updated for mongosh compatibility (`insertMany`, remove `db.auth()`)
- [ ] MongoDB 5.0 container started and healthy
- [ ] `mongorestore` completed successfully
- [ ] All collections present with correct document counts
- [ ] All indexes verified (especially text-search and unique indexes)
- [ ] Full-text search queries return correct results
- [ ] **mongoose left untouched at `5.13.x`** — API connects to MongoDB 5.0 without code changes
- [ ] Environment variables updated for Docker networking (`MONGODB_HOST=mongo`)
- [ ] API starts and connects to MongoDB 5.0 successfully
- [ ] End-to-end test: create, read, update, delete bookmarks/snippets/notes
- [ ] Backup cron job configured and tested
- [ ] Old bare-metal MongoDB 3.2 kept running until verification complete

## Rollback Plan

1. The old MongoDB 3.2 on Ubuntu 16 is untouched during this entire process
2. If restore fails or data is corrupt → dump again from old server and retry
3. If MongoDB 5.0 misbehaves against mongoose 5 → drop to `mongo:4.4` (also within mongoose 5's support matrix) and re-restore
4. If all else fails → keep running the bare-metal Mongo and only dockerize Keycloak + Node.js

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| `mongodump` from 3.2 incompatible with 5.0 `mongorestore` | High | Test locally first; `mongodump`/`mongorestore` is designed for cross-version portability |
| Text indexes behave differently in 5.0 | Medium | Run full-text search queries after restore and compare results with production |
| mongoose 5 driver edge cases against Mongo 5.0 | Medium | Local compatibility gate (Phase 0.3): run the API test suites against `mongo:5.0` before touching prod; fallback `mongo:4.4` |
| Host CPU lacks AVX (mongo:5.0 won't start) | Medium | Check before provisioning; fallback `mongo:4.4` |
| Data directory permissions wrong | Low | Verify with `docker exec codever-mongo ls -la /data/db` |
| Large dump file transfer fails | Low | Use `rsync` with resume capability; compress before transfer |

