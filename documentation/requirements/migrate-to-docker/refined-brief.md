# Migration Brief: Bare-metal Ubuntu 16 → Dockerized Deployment (new server)

> **Purpose of this document:** A refined, structured input for a planning agent.
> The agent's job is to produce a **step-by-step migration plan** (not to write app code yet).
> Application code changes will follow *after* the new infrastructure is stood up and verified.

---

## 1. Objective

Migrate Codever from a hand-configured bare-metal **Ubuntu 16.04** host to a **fully Dockerized
deployment orchestrated with Docker Compose on a new server** (Linode). Keep the current toolset
where sensible, but adopt **newer, still-compatible** versions of the infrastructure components
(MongoDB, Keycloak, nginx, Node) that will **not break the existing application code**.

**Guiding principle:** Infrastructure-first. Migrate + stabilize infra on the new server against the
*current* codebase. Defer application/framework code upgrades to a later phase.

---

## 2. Current State (verified from the repo)

### 2.1 Production server (bare metal, to be replaced)
| Component | Current version | Notes |
|---|---|---|
| OS | Ubuntu 16.04.1 LTS (xenial) | EOL |
| nginx | 1.12.0 | Reverse proxy + static file server + TLS termination |
| pm2 | 5.2.2 | Runs the Node API process |
| Node.js | 16.18.1 | API runtime |
| MongoDB | 3.2.11 | App database |
| MySQL | 5.7.17 | **Keycloak** backing store |
| TLS | Let's Encrypt (webroot) | Must be preserved |

### 2.2 Application (must keep working against new infra)
| App | Key versions / adapters | Migration constraint |
|---|---|---|
| `apps/codever-ui` | Angular **16.2**, `keycloak-angular ^11`, `keycloak-js 12`, `marked 4`, `katex 0.16` | Client relies on Keycloak base path `/auth` |
| `apps/codever-api` | Express 4.18, **`keycloak-connect 16.1.1`**, **`mongoose ^5.13`**, `aws-sdk 2` (S3) | mongoose 5 caps the safe MongoDB version; adapter must match Keycloak realm |
| API Dockerfile | `FROM node:10-slim` | **Stale** — server actually runs Node 16; must be reconciled |

### 2.3 Existing dev compose (`docker-compose.yml`) — reference, not prod-ready
- `mysql:5.7`, `quay.io/keycloak/keycloak:16.1.1` (legacy WildFly distro, `/auth` context), `mongo:3.4`.
- Keycloak realm export/import files live in `docker-compose-setup/keycloak-export-import/`.
- Custom Keycloak theme mounted from `apps/codever-keycloak-theme/codever/`.
- Mongo seeded via `docker-compose-setup/init-mongo.js` (contains full-text indexes).

### 2.4 nginx routing that MUST be preserved (from prod `codever.dev` config)
- HTTP→HTTPS + apex→`www` 301 redirects.
- Static SPA served from web root with `try_files … index.html` and `error_page 404 =200 /index.html`.
- `location /auth/` → Keycloak upstream (with enlarged proxy buffers for the Chrome extension).
- `location /api/` → Node upstream, `client_max_body_size 6m`.
- Let's Encrypt `/.well-known` passthrough.
- **Snippets→notes 301 rewrites** (Phase 2 migration) — must be carried over verbatim.

---

## 3. Target Architecture (to be detailed by the agent)

A single-host Docker Compose stack, roughly:

- **reverse-proxy / TLS** container (nginx, or Caddy/Traefik for automatic TLS — agent to compare).
- **codever-ui** static build served by the proxy (or a small nginx container).
- **codever-api** Node container (replacing pm2-on-host).
- **keycloak** container (upgraded, see §4.1).
- **keycloak-db** (MySQL/MariaDB or Postgres — agent to recommend).
- **mongo** container (upgraded within mongoose-5 compatibility, see §4.2).
- Named volumes for Mongo data, Keycloak DB data, and Let's Encrypt certs.
- Private Docker network; only the proxy exposes 80/443.

---

## 4. Key Decisions & Risk Areas (the agent must resolve these explicitly)

### 4.1 Keycloak upgrade — highest risk
- Current server = Keycloak **16.1.1** (legacy WildFly, `/auth` base path, `DB_VENDOR`/`KEYCLOAK_USER` env vars).
- Newer Keycloak (Quarkus, 17+ … current 26.x) has **breaking changes**:
  - Base path no longer `/auth` by default → must set `KC_HTTP_RELATIVE_PATH=/auth` to keep the
    nginx `location /auth/` proxy **and** the frontend `keycloak-js` config working unchanged.
  - New env vars (`KC_DB`, `KEYCLOAK_ADMIN`, `KC_HOSTNAME`, `KC_PROXY`/`KC_PROXY_HEADERS`, …).
  - Realm **import** format & flow (`--import-realm`) differs from the legacy export used today.
- **Constraint:** the app still uses `keycloak-connect 16.1.1` (API) and `keycloak-angular 11`/
  `keycloak-js 12` (UI). The agent must **verify these older adapters authenticate against the chosen
  newer Keycloak server** and pick the **highest server version that remains compatible** (or
  recommend a conservative target, e.g. a specific Keycloak LTS, with the compatibility rationale).
- Decide: **keep MySQL** for Keycloak vs **migrate to Postgres** (Keycloak's recommended DB). Include
  the data-migration path either way.

### 4.2 MongoDB upgrade — second highest risk
- Current = **3.2.11**; `mongoose ^5.13` does **not** officially support MongoDB 6/7+.
- MongoDB upgrades are **sequential** (cannot jump 3.2 → latest): 3.2→3.4→3.6→4.0→4.2→4.4→…
  each step requires setting `featureCompatibilityVersion`.
- **Recommended stance:** upgrade to the **newest MongoDB version officially supported by mongoose
  5.13** (agent to confirm exact ceiling — likely 4.4/5.0 range) so **no app code changes are needed**.
  Full jump to Mongo 6/7 is deferred to the later mongoose-upgrade code phase.
- Deliver: exact stepwise dump/restore **or** in-place FCV upgrade procedure, plus how the
  `init-mongo.js` full-text indexes are recreated/preserved.

### 4.3 Node runtime
- Reconcile the `node:10-slim` Dockerfile with the real Node 16 runtime.
- Recommend a maintained LTS (e.g. Node 18 or 20) **verified against** the API's dependencies
  (`mongoose 5`, `keycloak-connect`, `aws-sdk 2`). Flag anything that breaks; otherwise keep code untouched.

### 4.4 pm2 inside Docker (explicit question from stakeholder)
- Answer: In containers the norm is **one process per container + Docker restart policy**; `pm2` is
  usually unnecessary. If clustering/zero-downtime reload is desired, use **`pm2-runtime`** (not `pm2`).
- Agent to recommend one approach and justify (graceful shutdown / signal handling already noted in
  the current Dockerfile `CMD`).

### 4.5 nginx & static files (explicit question)
- Yes — keep nginx serving the static Angular build and terminating TLS, **but** run it as a
  container. Agent to choose between:
  - **A)** nginx + Certbot companion container (closest to current Let's Encrypt setup), or
  - **B)** Caddy / Traefik for **automatic** Let's Encrypt (less config, fewer moving parts).
- Whichever is chosen must reproduce every rule in §2.4 (redirects, buffers, body size, SPA fallback,
  snippets→notes rewrites, `/.well-known`).

### 4.6 TLS / Let's Encrypt
- Preserve Let's Encrypt. Define cert volume, issuance + **auto-renewal** in Docker, and cutover so
  there's no downtime / cert gap when DNS points to the new server.

---

## 5. Deployment Workflow (explicit question — "commit → deployment")

Current: manual upload of the Angular build and Node code. The agent should propose a simple,
low-maintenance improvement, e.g.:
- Build **UI** and **API** Docker images in CI (GitHub Actions), push to a registry (GHCR/Docker Hub).
- On the server: `docker compose pull && docker compose up -d` (via SSH step or a webhook).
- Keep it **single-host and simple**; document the manual fallback too.
- Address image tagging/versioning and how env/secrets (`env.json`, AWS S3 keys, Keycloak creds) are
  injected (Docker secrets / `.env`, **not** committed).

---

## 6. Cost / Simplicity Alternatives (explicit question)

Evaluate briefly and recommend, for a single Linode VPS:
- **Plain Docker Compose** (baseline — cheapest, already the plan).
- **Caddy/Traefik** to cut nginx+certbot complexity.
- **Self-hosted PaaS** layers on the same VPS — **Coolify**, **CapRover**, or **Dokku** — for
  git-push deploys without extra hosting cost.
- Note trade-offs (learning curve vs. convenience); the recommendation should favor "worry-free".

---

## 7. Constraints & Non-Goals

- **No application/framework code changes in this phase** (no Angular/mongoose/adapter upgrades yet).
  Any *unavoidable* change must be called out explicitly with justification.
- Preserve all current behavior: auth flows, `/api` + `/auth` routing, SPA fallback, redirects,
  full-text search indexes, S3 profile-image uploads.
- Migrate **existing data**: MongoDB app data **and** the Keycloak realm/users.
- Minimize downtime during cutover; provide a rollback path.

---

## 8. Expected Deliverables from the Planning Agent

1. **Target version matrix** — final chosen versions for MongoDB, Keycloak (+DB), Node, nginx/proxy,
   each with a one-line compatibility justification against the app adapters above.
2. **Phased migration plan** with ordered, verifiable steps:
   - Provision new server → build the Compose stack → migrate Keycloak → migrate MongoDB →
     wire nginx/TLS → deploy UI+API → verify → DNS cutover → decommission old server.
3. **`docker-compose.prod.yml`** design (services, networks, named volumes, healthchecks, restart
   policies, secrets/env strategy) — described in enough detail to implement.
4. **Data migration runbooks** — Keycloak realm export/import and the stepwise MongoDB upgrade path.
5. **nginx/proxy config** reproducing §2.4 (or the Caddy/Traefik equivalent).
6. **TLS issuance + auto-renewal** procedure in Docker.
7. **CI/CD deployment flow** (build → registry → `compose pull/up`) with a manual fallback.
8. **Cutover & rollback checklist**, plus a **post-migration verification checklist**
   (login, create/search bookmarks & notes, `/auth` + `/api`, redirects, S3 upload).
9. **Explicit answers** to the stakeholder questions: pm2-in-Docker, nginx static serving,
   deployment workflow, and cheaper alternatives.
10. **Open questions / assumptions** that need stakeholder confirmation before execution.

---

## 9. Open Questions for the Stakeholder (agent to confirm)
- Target Linode plan/size (RAM/disk) and whether a **staging** instance is available for a dry run.
- Acceptable **downtime window** for cutover.
- Keep **MySQL** for Keycloak or move to **Postgres**?
- Preferred registry (GHCR vs Docker Hub) and whether CI is GitHub Actions.
- Domain/DNS control for the Let's Encrypt + cutover step.
- Backup/restore expectations and retention for Mongo + Keycloak DB.

