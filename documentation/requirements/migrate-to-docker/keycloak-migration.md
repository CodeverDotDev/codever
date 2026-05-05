# Keycloak Migration: v16.1.1 (WildFly) → v24+ (Quarkus) with PostgreSQL

## Current State

| Component | Version / Detail |
|---|---|
| Keycloak | `quay.io/keycloak/keycloak:16.1.1` (WildFly-based) |
| Database | MySQL 5.7 (`codever-mysql` container) |
| Realm | `bookmarks` (exported in `docker-compose-setup/keycloak-export-import/`) |
| Custom theme | `apps/codever-keycloak-theme/codever/` (login theme inheriting `keycloak` parent, with custom CSS + logo) |
| Node.js adapter | `keycloak-connect@16.1.1` (pinned in `apps/codever-api/package.json`) |
| Auth URL (prod) | `https://www.codever.dev/auth` (proxied by nginx) |
| Auth URL (dev) | `http://localhost:8480/auth` |

## Target State

| Component | Version / Detail |
|---|---|
| Keycloak | `quay.io/keycloak/keycloak:24.x` or `25.x` (Quarkus-based) |
| Database | PostgreSQL 16 |
| Node.js adapter | `keycloak-connect@24.x` or switch to generic OpenID Connect (see Step 6) |
| Auth URL (prod) | `https://www.codever.dev/auth` (keep same path for backward compatibility) |

---

## How the data migration works (MySQL → PostgreSQL)

**You do NOT migrate the MySQL database directly.** There is no `mysqldump` → `pg_restore` step. Instead:

1. **Export** a realm JSON file from the old Keycloak 16 (running bare-metal with MySQL on Ubuntu 16)
2. **Start** a fresh Keycloak 24 container pointing at an empty PostgreSQL database
3. **Import** the realm JSON into Keycloak 24 — Keycloak automatically creates all tables in PostgreSQL and populates them with the realm config, clients, roles, and users from the JSON

```
┌─────────────────────────────────┐         ┌──────────────────────────────────────┐
│  OLD SERVER (Ubuntu 16)         │         │  NEW SERVER (Ubuntu 22.04/24.04)     │
│                                 │         │                                      │
│  Keycloak 16 (bare-metal)       │         │  Keycloak 24 (Docker)                │
│       ↓                         │  JSON   │       ↓                              │
│  MySQL 5.7 (bare-metal)         │ ──────→ │  PostgreSQL 16 (Docker)              │
│       ↓                         │  file   │       ↓                              │
│  realm JSON export              │         │  --import-realm auto-populates DB    │
└─────────────────────────────────┘         └──────────────────────────────────────┘
```

The realm JSON file contains **everything**: realm settings, clients, roles, users (with hashed passwords if exported via CLI), authentication flows, etc. Keycloak treats it as the single source of truth during import.

---

## Step-by-step Migration

### Step 1 — Export realm and users from current Keycloak 16

You already have realm exports in `docker-compose-setup/keycloak-export-import/`, but create a **fresh export** from the running production instance to capture the latest users, clients, and roles.

> **Important:** In production, Keycloak 16 runs **bare-metal** (not in Docker), so the export commands target the local filesystem, not `docker exec`.

#### Option A: CLI export from bare-metal Keycloak (recommended)

SSH into the production Ubuntu 16 server and run:

```bash
# Find your Keycloak installation directory (commonly /opt/keycloak or /opt/jboss/keycloak)
# Adjust the path below to match your actual installation

# Create output directory
mkdir -p /tmp/keycloak-export

# Run a secondary Keycloak instance on a different port solely for export
# This does NOT interfere with the running production instance
/opt/keycloak/bin/standalone.sh \
  -Djboss.socket.binding.port-offset=100 \
  -Dkeycloak.migration.action=export \
  -Dkeycloak.migration.provider=singleFile \
  -Dkeycloak.migration.file=/tmp/keycloak-export/bookmarks-realm-full-export.json \
  -Dkeycloak.migration.usersExportStrategy=REALM_FILE

# Wait for it to finish (you'll see "Export finished successfully" in the logs)
# Then Ctrl+C to stop the temporary instance
```

Copy the file to your local machine:
```bash
scp user@old-server:/tmp/keycloak-export/bookmarks-realm-full-export.json \
  ./docker-compose-setup/keycloak-export-import/
```

#### Option A2: CLI export if Keycloak IS in Docker (dev environment)
```bash
docker exec codever-keycloak /opt/jboss/keycloak/bin/standalone.sh \
  -Djboss.socket.binding.port-offset=100 \
  -Dkeycloak.migration.action=export \
  -Dkeycloak.migration.provider=singleFile \
  -Dkeycloak.migration.file=/tmp/keycloak/bookmarks-realm-full-export.json \
  -Dkeycloak.migration.usersExportStrategy=REALM_FILE

docker cp codever-keycloak:/tmp/keycloak/bookmarks-realm-full-export.json \
  ./docker-compose-setup/keycloak-export-import/
```

#### Option B: Admin Console export
1. Login to your production Keycloak Admin Console → `bookmarks` realm
2. Export → toggle "Export clients" and "Export groups and roles" ON
3. Save the JSON file

> **⚠️ Admin Console export does NOT include user credentials (passwords).** Users will exist but will have to reset their passwords. **Use CLI export (Option A) to preserve user passwords.**

---

### Step 2 — Set up PostgreSQL to replace MySQL

In the new `docker-compose.prod.yml`, replace the MySQL service:

```yaml
services:
  postgres:
    container_name: codever-postgres
    image: postgres:16-alpine
    networks:
      - backend
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: ${KC_DB_PASSWORD:-change_me_in_production}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U keycloak"]
      interval: 10s
      timeout: 5s
      retries: 5
```

**Why PostgreSQL?**
- Keycloak's recommended and best-tested database
- MySQL 5.7 is EOL (Oct 2023); MySQL 8 works but PostgreSQL has better Keycloak support
- Simpler config — no `DB_SCHEMA` quirks

---

### Step 3 — Configure Keycloak 24+ (Quarkus)

The Quarkus-based Keycloak image has a **completely different configuration model** compared to v16 WildFly. Key differences:

| WildFly (v16) | Quarkus (v24+) |
|---|---|
| `DB_VENDOR=MYSQL` | `KC_DB=postgres` |
| `DB_ADDR=mysql` | `KC_DB_URL=jdbc:postgresql://postgres:5432/keycloak` |
| `DB_USER=keycloak` | `KC_DB_USERNAME=keycloak` |
| `DB_PASSWORD=password` | `KC_DB_PASSWORD=change_me` |
| `KEYCLOAK_USER=admin` | `KC_BOOTSTRAP_ADMIN_USERNAME=admin` (first start only) |
| `KEYCLOAK_PASSWORD=Pa55w0rd` | `KC_BOOTSTRAP_ADMIN_PASSWORD=Pa55w0rd` (first start only) |
| `-Dkeycloak.migration.action=import` | `--import-realm` (with file mounted to `/opt/keycloak/data/import/`) |
| Theme path: `/opt/jboss/keycloak/themes/` | Theme path: `/opt/keycloak/themes/` |
| Entrypoint: `standalone.sh` | Entrypoint: `/opt/keycloak/bin/kc.sh start` |

Docker Compose service definition:

```yaml
  keycloak:
    container_name: codever-keycloak
    image: quay.io/keycloak/keycloak:24.0
    networks:
      - backend
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: ${KC_DB_PASSWORD:-change_me_in_production}
      KC_HOSTNAME: www.codever.dev
      KC_HTTP_RELATIVE_PATH: /auth          # keep /auth path for backward compat
      KC_PROXY_HEADERS: xforwarded          # trust nginx proxy headers
      KC_HTTP_ENABLED: "true"               # allow HTTP inside Docker network
      KC_BOOTSTRAP_ADMIN_USERNAME: admin     # only used on first boot
      KC_BOOTSTRAP_ADMIN_PASSWORD: ${KC_ADMIN_PASSWORD:-Pa55w0rd}
    # First run: import realm
    # command: start --import-realm
    # Subsequent runs:
    command: start
    ports:
      - "8480:8080"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./docker-compose-setup/keycloak-export-import:/opt/keycloak/data/import/
      - ./apps/codever-keycloak-theme/codever/:/opt/keycloak/themes/codever/
```

> **First run:** use `command: start --import-realm` to load the realm JSON.
> Keycloak will automatically create all schema tables in the empty PostgreSQL database, then populate them with the realm, clients, roles, and users from the JSON file.
> **Subsequent runs:** switch back to `command: start` for faster startup (data is already in PostgreSQL).

---

### Step 4 — Adapt the custom theme

The Keycloak theme structure is largely the same in v24, but:

1. **Theme path changed:** `/opt/jboss/keycloak/themes/` → `/opt/keycloak/themes/` (already handled in the volume mount above)

2. **Parent theme name check:** Your `theme.properties` uses `parent=keycloak` and `import=common/keycloak` — this still works in v24, but verify the PatternFly CSS references:
   ```ini
   styles=node_modules/patternfly/dist/css/patternfly.css ...
   ```
   Keycloak 24 uses PatternFly 5 internally. Test that your login page renders correctly. You may need to update CSS references.

3. **Test theme:** After starting Keycloak 24, go to Admin Console → Realm Settings → Themes → Login Theme → select `codever` → verify the login page visually.

---

### Step 5 — Realm JSON compatibility

The realm export from v16 is **mostly compatible** with v24 import, but watch for:

1. **Removed/renamed fields:** Some client settings changed names. The import usually handles this gracefully with warnings.

2. **Client scopes:** Keycloak 24 has new default client scopes. After import, verify that `bookmarks` and `bookmarks-api` clients have the correct scopes.

3. **Service accounts:** If you use `integration-tests-service-account` and `admin-service-account` (from `env.json` test config), verify their client secrets still work after import. You may need to regenerate secrets.

4. **Authentication flows:** If you customized any authentication flows, verify they imported correctly.

**Recommended approach:**
```bash
# 1. Start Keycloak 24 with import
docker compose -f docker-compose.prod.yml up keycloak

# 2. Check logs for import warnings/errors
docker logs codever-keycloak 2>&1 | grep -i "import\|error\|warn"

# 3. Login to admin console and verify:
#    - bookmarks realm exists
#    - clients (bookmarks, bookmarks-api) are present
#    - users are imported (if using CLI export)
#    - roles (ROLE_USER, ROLE_ADMIN) are present
#    - custom theme is selectable
```

---

### Step 6 — Update the Node.js adapter (`keycloak-connect`)

The `keycloak-connect` npm package is **deprecated** as of Keycloak 22+. Two options:

#### Option A: Upgrade `keycloak-connect` to latest compatible version (quick fix)
```bash
cd apps/codever-api
npm install keycloak-connect@24.0.5
```
This should still work since your usage is straightforward (`bearer-only` validation). Test thoroughly.

#### Option B: Switch to a generic OIDC library (long-term, recommended)
Replace `keycloak-connect` with a standard OpenID Connect middleware like `express-openid-connect` or `passport` + `passport-openidconnect`. This decouples you from Keycloak-specific libraries.

**Files that need changes (7 files):**
- `src/routes/admin/admin.router.js`
- `src/routes/users/user.router.js`
- `src/routes/users/bookmarks/personal-bookmarks.router.js`
- `src/routes/users/snippets/personal-snippets.router.js`
- `src/routes/users/notes/personal-notes.router.js`
- `src/routes/users/userid.validator.js`
- `src/routes/webpage-info/webpage-info.router.js`

> **Recommendation:** Start with Option A for the migration. Migrate to Option B later as a separate task.

---

### Step 7 — Update `env.json` for Docker production

The production Keycloak URL stays the same (`https://www.codever.dev/auth`) since nginx will proxy to the container. But add a `production-docker` environment:

```json
{
  "production-docker": {
    "environment": "production",
    "keycloak": {
      "realm": "bookmarks",
      "bearer-only": true,
      "auth-server-url": "http://keycloak:8080/auth",
      "ssl-required": "external",
      "resource": "bookmarks-api"
    },
    "basicApiUrl": "https://www.codever.dev/api"
  }
}
```

> **Important:** Inside Docker, the API talks to Keycloak via `http://keycloak:8080/auth` (service name). Externally, nginx proxies `https://www.codever.dev/auth` → `http://keycloak:8080/auth`.

---

### Step 8 — nginx config for `/auth` proxy

```nginx
# Keycloak
location /auth {
    proxy_pass         http://keycloak:8080/auth;
    proxy_set_header   Host              $host;
    proxy_set_header   X-Real-IP         $remote_addr;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
    proxy_set_header   X-Forwarded-Host  $host;
    proxy_set_header   X-Forwarded-Port  $server_port;
    proxy_buffer_size          128k;
    proxy_buffers              4 256k;
    proxy_busy_buffers_size    256k;
}
```

---

## Migration Checklist

- [ ] Fresh realm + users export from production Keycloak 16 (CLI export)
- [ ] PostgreSQL 16 container running and healthy
- [ ] Keycloak 24 container starts with `--import-realm`
- [ ] Realm `bookmarks` imported successfully (check logs)
- [ ] Admin console accessible, all clients/roles/users present
- [ ] Custom `codever` login theme renders correctly
- [ ] `keycloak-connect` upgraded to v24 (or replaced with OIDC lib)
- [ ] `env.json` production config updated
- [ ] nginx `/auth` proxy working (login + token exchange)
- [ ] End-to-end test: user can log in, create/view bookmarks
- [ ] Integration tests pass against new Keycloak
- [ ] Old MySQL volume and service removed from compose file

## Rollback Plan

1. Keep the old server (Ubuntu 16 + bare-metal Keycloak 16 + MySQL) running during migration
2. DNS points to old server until verification is complete
3. If anything fails, simply switch DNS back — zero data loss since old server was never touched
4. Only decommission old server after 1-2 weeks of stable production on the new setup

## Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Realm import fails on v24 | High | Test import on local Docker first; fix JSON manually if needed |
| User passwords lost | High | Use CLI export (not Admin Console) to include credentials |
| `keycloak-connect` incompatibility | Medium | Test all protected endpoints; fall back to generic OIDC if needed |
| Custom theme broken | Low | Visual testing; theme structure is backward-compatible |
| Token format changes | Medium | Verify JWT claims match what the API expects (`userid.validator.js`) |

