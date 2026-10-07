# MongoDB migration scripts

This folder contains one-off MongoDB migration scripts for the Codever API. They adjust
schema-less data, rename fields, and (most commonly) create or re-weight the MongoDB
**text search indexes** used by bookmarks, snippets, and notes.

- [Script styles](#script-styles)
- [Prerequisites](#prerequisites)
- [Running locally (Docker)](#running-locally-docker)
- [Running in production (Docker)](#running-in-production-docker)
- [Verifying the result](#verifying-the-result)
- [Rolling back](#rolling-back)
- [Backing up before a production change](#backing-up-before-a-production-change)
- [Writing new scripts](#writing-new-scripts)

## Script styles

There are two styles of script in this folder, and they are invoked differently:

| Style | Example | How it is written | How to run |
|---|---|---|---|
| **Shell script** | `full_text_search-indexes/*.js`, `1640761844872_replace-fulltext-indexes-DONE.js`, `*.mongo` | Uses the `mongosh` shell API directly (`db.bookmarks.createIndex(...)`) | Pipe the file into `mongosh` |
| **Reusable function** | `1791158400000_copyable-fields-text-indexes.js`, `1791158400001_adjust-bookmark-note-text-index-weights.js` | Exports an `async function(database, rollback)` so the Jest integration tests can call it with the Node.js driver handle | Pipe the file into `mongosh` **or** `require()` it in Node.js |

> **Why both exist:** the reusable scripts are covered by the integration tests
> (`src/routes/users/copyable-fields.integration-test.js`), which pass Mongoose's
> Node.js driver handle (`mongoose.connection.db`). Those scripts include small
> `getCollection()` / `listIndexes()` helpers so the **same file** works with both the
> Node.js driver (`db.collection(name)`, `collection.indexes()`) and the `mongosh`
> shell (`db.getCollection(name)`, `collection.getIndexes()`).

All commands below use `mongosh`, which is bundled inside the `mongo` Docker container
(`codever-mongo`), so you do not need `mongosh` installed on your host.

> **Which copyable-fields script do I run in production?** Only
> `1791158400001_adjust-bookmark-note-text-index-weights.js`. It is **self-contained**: it
> recreates the full text index with the copyable fields (`copyableFields.label` /
> `copyableFields.value`, weight `1`) already included **and** applies the final search
> weights (`name`/`title` 21, `tags` 8) in a single step. It therefore **supersedes**
> `1791158400000_copyable-fields-text-indexes.js` — you do **not** need to run the earlier
> script first. (`1791158400000` only matters if you specifically want the interim
> `tags: 10` state, which is not the production target.)

## Prerequisites

The migrations connect as the MongoDB **root** user and authenticate against the `admin`
database. The connection values differ by environment:

| | Container | Username | Password | Database |
|---|---|---|---|---|
| **Local** (`docker-compose.yml`) | `codever-mongo` | `mongoadmin` | `secret` | `dev-bookmarks` |
| **Production** (`docker-compose.prod.yml`) | `codever-mongo` | `mongoadmin` | `$MONGO_ADMIN_PASSWORD` (from server `.env`) | value of `MONGODB_BOOKMARKS_COLLECTION` (defaults to `dev-bookmarks`) |

> The application itself connects as the less-privileged `bookmarks` user
> (see `src/app.js`), but index changes are run as the root `mongoadmin` user.

## Running locally (Docker)

Run all commands from the **repository root**. Make sure MongoDB is up:

```bash
docker compose up -d mongo
```

Run a migration by piping it into `mongosh` inside the container. Example with the
text-index weight migration:

```bash
docker exec -i codever-mongo \
  mongosh --quiet \
  --username mongoadmin \
  --password secret \
  --authenticationDatabase admin \
  dev-bookmarks \
  < apps/codever-api/resources/db-migration/mongodb/1791158400001_adjust-bookmark-note-text-index-weights.js
```

On success the reusable scripts print the applied index weights, for example:

```text
Text index weights updated successfully:
[
  { collection: 'bookmarks', name: 'full_text_search',       weights: { name: 21, tags: 8, ... } },
  { collection: 'notes',     name: 'notes_full_text_search', weights: { title: 21, tags: 8, ... } }
]
```

> The leading `[Function: ...]` / `[AsyncFunction: ...]` lines are just `mongosh`
> echoing each loaded definition and can be ignored.

## Running in production (Docker)

Run these on the production host from the directory that contains
`docker-compose.prod.yml` and the server-side `.env`.

### 1. Resolve the production database name

```bash
export MONGODB_DB="$(sed -n 's/^MONGODB_BOOKMARKS_COLLECTION=//p' .env)"
# Fall back to the default if the variable is not set in .env:
: "${MONGODB_DB:=dev-bookmarks}"
echo "Using database: $MONGODB_DB"
```

### 2. Read the Mongo admin password without printing it

```bash
read -rsp 'Mongo admin password: ' MONGO_ADMIN_PASSWORD
printf '\n'
```

### 3. Run the migration

```bash
docker exec -i codever-mongo \
  mongosh --quiet \
  --username mongoadmin \
  --password "$MONGO_ADMIN_PASSWORD" \
  --authenticationDatabase admin \
  "$MONGODB_DB" \
  < apps/codever-api/resources/db-migration/mongodb/1791158400001_adjust-bookmark-note-text-index-weights.js
```

> If the migration file is not present in the production checkout, copy it from the
> repository first — do not retype it on the server.

## Verifying the result

The reusable scripts print the applied weights automatically. You can also inspect the
indexes directly at any time.

Local:

```bash
docker exec codever-mongo \
  mongosh --quiet \
  --username mongoadmin \
  --password secret \
  --authenticationDatabase admin \
  dev-bookmarks \
  --eval 'printjson({
    bookmarks: db.bookmarks.getIndexes().filter(index => index.weights),
    notes: db.notes.getIndexes().filter(index => index.weights)
  })'
```

Production (reusing `$MONGO_ADMIN_PASSWORD` and `$MONGODB_DB` from above):

```bash
docker exec codever-mongo \
  mongosh --quiet \
  --username mongoadmin \
  --password "$MONGO_ADMIN_PASSWORD" \
  --authenticationDatabase admin \
  "$MONGODB_DB" \
  --eval 'printjson({
    bookmarks: db.bookmarks.getIndexes().filter(index => index.weights),
    notes: db.notes.getIndexes().filter(index => index.weights)
  })'
```

Expected relevant values after the weight migration:

```text
bookmarks: name: 21, tags: 8
notes:     title: 21, tags: 8
```

## Rolling back

The weight migration is reversible. Set `TEXT_INDEX_WEIGHTS_ROLLBACK=true` before the
script is loaded to restore the previous weights (`name`/`title` 13, `tags` 10).

Local:

```bash
docker exec -i codever-mongo \
  mongosh --quiet \
  --username mongoadmin \
  --password secret \
  --authenticationDatabase admin \
  dev-bookmarks \
  --eval 'TEXT_INDEX_WEIGHTS_ROLLBACK=true' \
  < apps/codever-api/resources/db-migration/mongodb/1791158400001_adjust-bookmark-note-text-index-weights.js
```

Production: use the same command with `"$MONGO_ADMIN_PASSWORD"` and `"$MONGODB_DB"`.

> The copyable-fields migration (`1791158400000_...`) uses `COPYABLE_FIELDS_ROLLBACK=true`
> for the same purpose.

The scripts perform a **preflight check** and abort before dropping anything if they find
an unexpected text index, so a misconfigured database fails safely instead of losing an
index.

## Backing up before a production change

These migrations drop and recreate only the recognized text indexes and do not modify
documents, but always take a backup before changing production:

```bash
docker exec codever-mongo \
  mongodump \
  --username mongoadmin \
  --password "$MONGO_ADMIN_PASSWORD" \
  --authenticationDatabase admin \
  --db "$MONGODB_DB" \
  --archive --gzip \
  > "codever-${MONGODB_DB}-$(date +%Y%m%d-%H%M%S).archive.gz"
```

## Writing new scripts

- Name files `<epoch-millis>_<short-description>.js`; append `-DONE` once applied to prod.
- Prefer the **reusable function** style for anything exercised by tests so the same file
  runs under both the Node.js driver and `mongosh`.
- Reuse the `getCollection()` / `listIndexes()` helpers from the copyable-fields scripts
  for cross-environment compatibility.
- Always preflight for unexpected indexes before dropping, and support a rollback flag.
