# MongoDB Migration: 3.4 → 7.0 (Dockerized with Host Volume)

## Current State

| Component | Detail |
|---|---|
| MongoDB version | 3.4 (bare-metal on Ubuntu 16 in production, `mongo:3.4` Docker image in dev) |
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
| MongoDB version | `mongo:7.0` (Docker container) |
| Data storage | Named Docker volume **or** bind-mount to host directory |
| Mongoose driver | `mongoose@7.x` or `8.x` (required for MongoDB 7 compatibility) |
| `mongodb` Node.js driver | `6.x` (comes with mongoose 7/8) |

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
    image: mongo:7.0
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
    image: mongo:7.0
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

### Step 1 — Dump data from production MongoDB 3.4

On your current Ubuntu 16 server where MongoDB 3.4 is running bare-metal:

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

> **Important:** `mongodump`/`mongorestore` output is version-independent BSON. You can dump from 3.4 and restore directly into 7.0 — no need to step through intermediate versions. The stepping-through-versions requirement only applies to **in-place upgrades** (reusing the same data directory).

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

### Step 4 — Start MongoDB 7.0 container (empty, for initial setup)

Add this to your `docker-compose.prod.yml`:

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
    image: mongo:7.0
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

> **Note:** MongoDB 7.0 uses `mongosh` instead of the legacy `mongo` shell.

Start it up:
```bash
docker compose -f docker-compose.prod.yml up -d mongo
```

### Step 5 — Update `init-mongo.js` for MongoDB 7.0 compatibility

The existing `init-mongo.js` uses `db.bookmarks.insert()` which is **removed** in MongoDB 7.0. Update to use `insertMany()`:

```javascript
// db.bookmarks.insert([...])    // ❌ Removed in MongoDB 5.0+
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

### Step 6 — Restore the dump into MongoDB 7.0

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

### Step 8 — Upgrade Mongoose in `codever-api`

`mongoose@5.13.23` does **not** support MongoDB 7.0. You need to upgrade:

| Current | Target | MongoDB 7 support |
|---|---|---|
| `mongoose@5.13.23` | `mongoose@7.8.x` or `8.x` | ✅ |
| `mongodb` driver `3.7.4` | `6.x` (bundled with mongoose 7/8) | ✅ |

```bash
cd apps/codever-api
npm install mongoose@8
```

**Breaking changes to address:**

1. **Removed options** — Remove from `app.js`:
   ```javascript
   // ❌ These options are removed in Mongoose 7+
   // useNewUrlParser: true,
   // useUnifiedTopology: true,
   // useFindAndModify: false,

   // ✅ Just use:
   const mongooseConnectOptions = {};
   ```

2. **`findOneAndUpdate()` returns the document differently** — In Mongoose 7+, `returnDocument: 'after'` replaces `new: true`. Check all `.findOneAndUpdate()` / `.findOneAndDelete()` calls.

3. **`remove()` is removed** — Replace with `deleteOne()` or `deleteMany()`.

4. **Callback-based queries removed** — All queries must use `await` or `.then()`. Your code likely already uses promises/async-await, but check for any remaining callbacks.

5. **`Schema.Types.ObjectId` validation is stricter** — Ensure all ObjectIds are valid.

**Quick way to find all affected calls:**
```bash
cd apps/codever-api
grep -rn "\.remove(" src/
grep -rn "useNewUrlParser\|useUnifiedTopology\|useFindAndModify" src/
grep -rn "{ new: true }" src/
grep -rn "callback\|function(err" src/
```

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

- [ ] `mongodump` from production MongoDB 3.4 completed
- [ ] Dump files transferred to new server
- [ ] Host directories created with correct permissions (`/data/codever/mongodb`)
- [ ] `init-mongo.js` updated for MongoDB 7.0 compatibility (`insertMany`, remove `db.auth()`)
- [ ] MongoDB 7.0 container started and healthy
- [ ] `mongorestore` completed successfully
- [ ] All collections present with correct document counts
- [ ] All indexes verified (especially text-search and unique indexes)
- [ ] Full-text search queries return correct results
- [ ] `mongoose` upgraded to v7 or v8 in `codever-api`
- [ ] Removed deprecated Mongoose options (`useNewUrlParser`, etc.)
- [ ] Fixed any `remove()` → `deleteOne()`/`deleteMany()` calls
- [ ] Environment variables updated for Docker networking (`MONGODB_HOST=mongo`)
- [ ] API starts and connects to MongoDB 7.0 successfully
- [ ] End-to-end test: create, read, update, delete bookmarks/snippets/notes
- [ ] Backup cron job configured and tested
- [ ] Old bare-metal MongoDB 3.4 kept running until verification complete

## Rollback Plan

1. The old MongoDB 3.4 on Ubuntu 16 is untouched during this entire process
2. If restore fails or data is corrupt → dump again from old server and retry
3. If Mongoose upgrade causes issues → pin `mongoose@6.x` as an intermediate step (supports both Mongo 5 and 6)
4. If all else fails → keep running the bare-metal Mongo and only dockerize Keycloak + Node.js

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| `mongodump` from 3.4 incompatible with 7.0 `mongorestore` | High | Test locally first; `mongodump`/`mongorestore` is designed for cross-version portability |
| Text indexes behave differently in 7.0 | Medium | Run full-text search queries after restore and compare results with production |
| Mongoose 5 → 8 breaking changes | Medium | Run full test suite; use Mongoose migration guide; consider interim step to v6 |
| Data directory permissions wrong | Low | Verify with `docker exec codever-mongo ls -la /data/db` |
| Large dump file transfer fails | Low | Use `rsync` with resume capability; compress before transfer |

