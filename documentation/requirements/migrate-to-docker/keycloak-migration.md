# Keycloak Migration: v16.1.1 (WildFly) → v24 (Quarkus) with PostgreSQL

> **Version rationale (infrastructure-first, no code changes):** the app keeps its current
> adapters — `keycloak-connect@16.1.1` (API, bearer-only) and `keycloak-js 12` /
> `keycloak-angular 11` (UI). Both talk standard OIDC and work against newer Keycloak servers
> **as long as the `/auth` base path is preserved** (`KC_HTTP_RELATIVE_PATH=/auth`).
> Keycloak **24.0** is the conservative Quarkus target; compatibility **must be proven in the local
> gate (Step 6) before cutover**. Adapter upgrades are deferred to the code phase
> ([migration-plan.md](migration-plan.md), Phase 10).

## Current State

| Component       | Version / Detail                                                                                          |
|-----------------|-----------------------------------------------------------------------------------------------------------|
| Keycloak        | 16.1.1 (WildFly-based; bare-metal in prod, `quay.io/keycloak/keycloak:16.1.1` in dev)                     |
| Database        | MySQL 5.7 (bare-metal in prod, `codever-mysql` container in dev)                                          |
| Realm           | `bookmarks` (exported in `docker-compose-setup/keycloak-export-import/`)                                  |
| Custom theme    | `apps/codever-keycloak-theme/codever/` (login theme inheriting `keycloak` parent, with custom CSS + logo) |
| Node.js adapter | `keycloak-connect@16.1.1` (pinned in `apps/codever-api/package.json`)                                     |
| UI adapters     | `keycloak-js 12` + `keycloak-angular ^11` (pinned in `apps/codever-ui/package.json`)                      |
| Auth URL (prod) | `https://www.codever.dev/auth` (proxied by nginx)                                                         |
| Auth URL (dev)  | `http://localhost:8480/auth`                                                                              |

## Target State

| Component       | Version / Detail                                                             |
|-----------------|------------------------------------------------------------------------------|
| Keycloak        | `quay.io/keycloak/keycloak:24.0` (Quarkus-based)                             |
| Database        | PostgreSQL 16                                                                |
| Node.js adapter | **`keycloak-connect@16.1.1` — UNCHANGED** (verified in Step 6)               |
| UI adapters     | **`keycloak-js 12` / `keycloak-angular 11` — UNCHANGED** (verified in Step 6)|
| Auth URL (prod) | `https://www.codever.dev/auth` (same path — `KC_HTTP_RELATIVE_PATH=/auth`)   |

---

## How the data migration works (MySQL → PostgreSQL)

**You do NOT migrate the MySQL database directly.** There is no `mysqldump` → `pg_restore` step. Instead:

1. **Export** a realm JSON file from the old Keycloak 16 (running bare-metal with MySQL on Ubuntu 16)
2. **Start** a fresh Keycloak 24 container pointing at an empty PostgreSQL database
3. **Import** the realm JSON into Keycloak 24 — Keycloak automatically creates all tables in PostgreSQL and populates
   them with the realm config, clients, roles, and users from the JSON

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

The realm JSON file contains **everything**: realm settings, clients, roles, users (with hashed passwords if exported
via CLI), authentication flows, etc. Keycloak treats it as the single source of truth during import.

---

## Step-by-step Migration

### Step 1 — Export realm and users from current Keycloak 16

You already have realm exports in `docker-compose-setup/keycloak-export-import/`, but create a **fresh export** from the
running production instance to capture the latest users, clients, and roles.

> **Important:** In production, Keycloak 16 runs **bare-metal** (not in Docker), so the export commands target the local
> filesystem, not `docker exec`.

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

> **⚠️ Admin Console export does NOT include user credentials (passwords).** Users will exist but will have to reset
> their passwords. **Use CLI export (Option A) to preserve user passwords.**

---

### Step 1b — Sanitize the realm export before import (REQUIRED)

> ✅ **Verified in the local compatibility gate (2026-07-24):** the dev export failed KC 24 import
> with `ERROR: Script upload is disabled` until sanitized. The production export was created the
> same way (KC ≤16 defaults), so expect the **same two fixes**.
> The **users file (`*-users-*.json`) needs NO changes** — password hashes (pbkdf2), role mappings
> and attributes from KC 16 import as-is into KC 24.

Only the **realm** JSON needs edits:

**1. Remove the `"type": "js"` "Default Policy"** (KC ≤16 Authorization Services boilerplate under
the `bookmarks-api` client — JS policy upload is permanently removed in modern Keycloak; the API is
`bearer-only` and never evaluates it):

```bash
# find it
grep -n '"type" *: *"js"' bookmarks-realm-full-export.json
```

Delete the whole `"Default Policy"` object from `authorizationSettings.policies` and empty the
reference in `"Default Permission"`:

```json
"config" : {
  "defaultResourceType" : "urn:bookmarks-api:resources:default",
  "applyPolicies" : "[]"
}
```

**2. Fix the theme settings** (v1 account theme was removed in KC 22):

```bash
grep -n 'Theme' bookmarks-realm-full-export.json
```

```json
"loginTheme" : "codever",        // keep/verify — the custom login theme
"accountTheme" : "keycloak.v2",  // was "codever" → v1 account themes removed in KC 22
"emailTheme" : "codever",        // fine — parent 'base' still exists
```

**3. Allow post-logout redirects on the `bookmarks` frontend client** (KC 18 changed OIDC logout;
the client attribute `post.logout.redirect.uris` did not exist in KC 16 exports). Add it to the
`bookmarks` client's `attributes`:

```json
"attributes" : {
  "post.logout.redirect.uris" : "+",   // "+" = same as the client's Valid Redirect URIs
  ...
}
```

> ⚠️ **Paired with a small UI code change** (found in the local gate, 2026-07-24): logging out
> against KC 24 fails with `Invalid parameter: redirect_uri` because `keycloak-js 12` still sends
> the legacy parameter and the server-side compatibility switch
> (`--spi-login-protocol-openid-connect-legacy-logout-redirect-uri`) was **removed in KC 24**.
> `navigation.component.ts#doLogout()` now builds the OIDC-compliant logout URL manually
> (`post_logout_redirect_uri` + `id_token_hint`). This is the migration's one unavoidable code
> change — see [additional-tasks.md](additional-tasks.md) §5.

**4. Nothing else.** Other deprecated fields import gracefully with warnings — check the logs
(Step 5) rather than editing preemptively.

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
      test: [ "CMD-SHELL", "pg_isready -U keycloak" ]
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

The Quarkus-based Keycloak image has a **completely different configuration model** compared to v16 WildFly. Key
differences:

| WildFly (v16)                             | Quarkus (v24+)                                                       |
|-------------------------------------------|----------------------------------------------------------------------|
| `DB_VENDOR=MYSQL`                         | `KC_DB=postgres`                                                     |
| `DB_ADDR=mysql`                           | `KC_DB_URL=jdbc:postgresql://postgres:5432/keycloak`                 |
| `DB_USER=keycloak`                        | `KC_DB_USERNAME=keycloak`                                            |
| `DB_PASSWORD=password`                    | `KC_DB_PASSWORD=change_me`                                           |
| `KEYCLOAK_USER=admin`                     | `KC_BOOTSTRAP_ADMIN_USERNAME=admin` (first start only)               |
| `KEYCLOAK_PASSWORD=Pa55w0rd`              | `KC_BOOTSTRAP_ADMIN_PASSWORD=Pa55w0rd` (first start only)            |
| `-Dkeycloak.migration.action=import`      | `--import-realm` (with file mounted to `/opt/keycloak/data/import/`) |
| Theme path: `/opt/jboss/keycloak/themes/` | Theme path: `/opt/keycloak/themes/`                                  |
| Entrypoint: `standalone.sh`               | Entrypoint: `/opt/keycloak/bin/kc.sh start`                          |

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
> Keycloak will automatically create all schema tables in the empty PostgreSQL database, then populate them with the
> realm, clients, roles, and users from the JSON file.
> **Subsequent runs:** switch back to `command: start` for faster startup (data is already in PostgreSQL).

---

### Step 4 — Adapt the custom theme

**How theming works after the migration — same as today, conceptually:** the theme is just a
folder bind-mounted into the container (new Quarkus path: `/opt/keycloak/themes/codever`, already
in the compose volume above). No build/packaging step. The realm import carries the theme
selection (`loginTheme: codever`). Note: in prod mode (`start`) Keycloak **caches themes** — a
container restart is needed to pick up theme changes (only dev mode disables the cache).

Audit of the actual theme content (`apps/codever-keycloak-theme/codever/`) against Keycloak 24:

| Sub-theme | Content | Verdict on KC 24 |
|---|---|---|
| `login/` | `parent=keycloak`; custom `css/logo.css` (logo override) + logo image; `kcLogoLink` | ⚠️ **1-line fix needed** (see below) |
| `account/` | `parent=keycloak`; custom `css/account.css`, `css/logo.css` | ❌ **Drop for now** — FreeMarker account theme (v1) was **removed in KC 22**; the account console is now a React app (`keycloak.v2`) |
| `email/` | `parent=base`; custom `html/` templates + `messages/` | ✅ Works — `base` email theme still exists; verify one email renders (e.g. password reset) |

**Required fix — `login/theme.properties`:** the `styles=` line references parent-theme assets
from the WildFly-era `keycloak` theme that **no longer exist** in KC 24
(`node_modules/patternfly/...`, `lib/zocial/zocial.css`) → the login page would render unstyled.
Since the only real customization is the logo + link, rebase the line on KC 24's built-in styles:

```ini
parent=keycloak
import=common/keycloak

# KC 24 parent assets (check the styles= line of the built-in keycloak login theme
# inside the container: /opt/keycloak/lib/lib/main/org.keycloak.keycloak-themes-*.jar
# → theme/keycloak/login/theme.properties) + our logo override appended:
styles=css/login.css css/logo.css

kcLogoLink=https://www.codever.dev
```

(Extract the exact built-in list with:
`docker exec codever-keycloak sh -c "unzip -p /opt/keycloak/lib/lib/main/org.keycloak.keycloak-themes-*.jar theme/keycloak/login/theme.properties | grep ^styles"`.)

**Account theme:** after realm import, set Realm Settings → Themes → Account Theme to the default
(`keycloak.v2`). Re-branding the new React account console is a **Phase 10 code task**
([additional-tasks.md](additional-tasks.md)).

**Test:** Admin Console → Realm Settings → Themes → Login Theme → `codever` → open the login page
and verify logo, styling, and the logo link; then trigger a password-reset email to verify the
email theme.

---

### Step 5 — Realm JSON compatibility

The realm export from v16 is **mostly compatible** with v24 import, but watch for:

1. **Removed/renamed fields:** Some client settings changed names. The import usually handles this gracefully with
   warnings.

2. **Client scopes:** Keycloak 24 has new default client scopes. After import, verify that `bookmarks` and
   `bookmarks-api` clients have the correct scopes.

3. **Service accounts:** If you use `integration-tests-service-account` and `admin-service-account` (from `env.json`
   test config), verify their client secrets still work after import. You may need to regenerate secrets.

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

### Step 6 — Verify the EXISTING adapters against Keycloak 24 (no upgrade in this phase)

**Nothing is upgraded here.** This step is the **local compatibility gate** required by the
migration plan (Phase 0.3) — it must pass before any production work.

Why the old adapters are expected to work:

- **API (`keycloak-connect@16.1.1`, bearer-only):** it only validates JWTs offline against the realm
  public key / issuer — no server-side session APIs. Token signature (RS256), `iss` and realm key
  discovery are unchanged in Keycloak 24, provided the issuer URL stays
  `https://www.codever.dev/auth/realms/bookmarks` (hence `KC_HTTP_RELATIVE_PATH=/auth`).
- **UI (`keycloak-js 12`):** uses the standard OIDC auth-code flow endpoints under
  `/auth/realms/bookmarks/protocol/openid-connect/…` — still served at the same paths with the
  relative-path setting.

Verification procedure — run locally with **`docker-compose.migration-test.yml`** (repo root; it
starts Keycloak 24 + Postgres 16 + mongo:5.0 on the same ports as the dev stack, imports the
`bookmarks` realm and mounts the custom theme, so the unchanged app needs zero config changes):

```bash
# 0. Start the target stack + the unchanged app
docker compose down                                    # stop the old dev stack first (port clash)
docker compose -f docker-compose.migration-test.yml up # watch logs for realm-import warnings
npm start                                              # backend :3000 + frontend :4200 as usual
# 1. UI login flow: open http://localhost:4200, log in via the Keycloak login page (keycloak-js 12)
#    — dev user mock/mock — verify the custom 'codever' theme renders, token refresh after ~5 min
#    idle, and logout
# 2. API bearer validation: call a protected endpoint with the obtained access token
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:3000/api/personal/users/$USER_ID/bookmarks
# 3. Check JWT claims still match what userid.validator.js expects (sub = userId)
# 4. Run the API integration tests against the new stack:
cd apps/codever-api && npx jest --config jest.config.integration.js
```

> The test stack runs Keycloak in **dev mode** (`start-dev`): theme caching is off, so
> `login/theme.properties` fixes (Step 4) can be tested with a plain browser refresh.
> Data lives in separate `*_migration_test` volumes — reset with
> `docker compose -f docker-compose.migration-test.yml down -v`.

**If (and only if) validation fails** with the pinned adapters, escalate: try the highest Keycloak
version that passes (e.g. 22.x, 19.x) and record the finding — do **not** silently upgrade
`keycloak-connect`. Adapter modernization (newer `keycloak-connect` or a generic OIDC library such
as `express-openid-connect`) is a **Phase 10 code task**; the 7 files touched by it are listed in
[additional-tasks.md](additional-tasks.md) §5.

---

### Step 7 — Update `env.json` for Docker production

The production Keycloak URL stays the same (`https://www.codever.dev/auth`) since nginx will proxy to the container. But
add a `production-docker` environment:

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

> **Important:** Inside Docker, the API talks to Keycloak via `http://keycloak:8080/auth` (service name). Externally,
> nginx proxies `https://www.codever.dev/auth` → `http://keycloak:8080/auth`.

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
- [x] Realm JSON **sanitized** (Step 1b): `js` Default Policy removed, `accountTheme` → `keycloak.v2`, `post.logout.redirect.uris` added to the `bookmarks` client (users file untouched) — *verified in local gate 2026-07-24; repeat on the prod export*
- [x] Logout verified against KC 24 (requires the `doLogout()` fix in `navigation.component.ts` — see [additional-tasks.md](additional-tasks.md) §5) — *verified in local gate 2026-07-24*
- [ ] PostgreSQL 16 container running and healthy
- [ ] Keycloak 24 container starts with `--import-realm`
- [ ] Realm `bookmarks` imported successfully (check logs)
- [ ] Admin console accessible, all clients/roles/users present
- [ ] Custom `codever` **login** theme renders correctly (after `styles=` fix in Step 4)
- [ ] Account Theme switched to default `keycloak.v2` (old v1 account theme removed in KC 22)
- [ ] Custom **email** theme verified (send a password-reset email)
- [ ] **Local compatibility gate passed**: `keycloak-connect 16.1.1` + `keycloak-js 12` verified against Keycloak 24 (Step 6) — adapters unchanged
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

| Risk                               | Impact | Mitigation                                                           |
|------------------------------------|--------|----------------------------------------------------------------------|
| Realm import fails on v24          | High   | Test import on local Docker first; fix JSON manually if needed       |
| User passwords lost                | High   | Use CLI export (not Admin Console) to include credentials            |
| Old adapters (kc-connect 16 / kc-js 12) incompatible with KC 24 | High | Local compatibility gate (Step 6) blocks the migration until proven; fallback = step down the Keycloak server version until it passes |
| Custom theme broken                | Low    | Login theme needs the 1-line `styles=` rebase (Step 4); account theme dropped to `keycloak.v2`; visual testing before cutover |
| Token format changes               | Medium | Verify JWT claims match what the API expects (`userid.validator.js`) |

