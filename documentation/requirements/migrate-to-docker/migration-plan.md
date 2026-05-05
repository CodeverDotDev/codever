# Plan: Dockerize Codever Production Deployment

**TL;DR:** Migrate from bare-metal Ubuntu 16 to a fully dockerized setup on a **new server** using Docker Compose. Since you already have working Docker Compose config for dev, extending it to production is straightforward and the best approach for a small app — no Kubernetes needed. Put everything (nginx, Node.js API, Angular static files, MongoDB, Keycloak+PostgreSQL) in containers.

## Why a new server is required (not optional)

Ubuntu 16.04 LTS reached **end of life in April 2021**. This makes an in-place dockerization impractical:

- **Docker no longer publishes packages for Ubuntu 16.04.** You cannot `apt install docker-ce` from the official Docker repository. Any Docker version you could get running would itself be old and unsupported.
- **The kernel is too old.** Ubuntu 16.04 ships with kernel 4.4. Modern Docker images (mongo:7, Keycloak 24+) expect kernel features (cgroups v2, overlay2 improvements) from kernel 5.x+.
- **No security updates.** Running any production service on an EOL OS is a security liability — unpatched kernel, OpenSSL, glibc, etc.
- **Incremental migration on the same box is not worth the risk.** Even if you hacked Docker onto Ubuntu 16, you'd still need to migrate the OS eventually, doing the work twice.

**Bottom line:** Provision a new server first, set everything up with Docker there, then migrate data and switch DNS. The old server stays untouched as your rollback safety net.

## Steps

### 1. Provision a new server
Set up a modern **Ubuntu 22.04 or 24.04 LTS** and install only Docker + Docker Compose. No need for Node.js, MongoDB, or Keycloak installed on the host.

```bash
# On the new Ubuntu 22.04/24.04 server:
sudo apt update && sudo apt upgrade -y
# Install Docker (official method)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Docker Compose v2 is included with Docker Engine
docker compose version
```

### 2. Create a `docker-compose.prod.yml`
With these services:
- **nginx** — reverse proxy + serves the Angular static build, handles SSL (with Let's Encrypt/certbot sidecar or mounted certs)
- **codever-api** — update the existing `apps/codever-api/Dockerfile` (bump from `node:10-slim` to `node:20-slim`, remove nodemon, run with PM2 or plain `node bin/www`)
- **mongo** — upgrade from `mongo:3.4` to `mongo:7` (or latest 6.x); plan data migration with `mongodump`/`mongorestore`
- **keycloak** — upgrade from `quay.io/keycloak/keycloak:16.1.1` to Keycloak 24+ (new Quarkus-based image, different config format)
- **postgresql** — for Keycloak's database; replacing MySQL 5.7 with PostgreSQL 16 (Keycloak's recommended DB). See [keycloak-migration.md](keycloak-migration.md) for details.

### 3. Migrate production data
Before cutover:
- `mongodump` from the current bare-metal MongoDB → `mongorestore` into the new containerized Mongo (handle auth + index recreation from `docker-compose-setup/init-mongo.js`)
- Export Keycloak realm/users from old instance → import into new container (use the existing export-import scripts in `docker-compose-setup/keycloak-export-import/`)
- Verify the MySQL/Keycloak data via `mysqldump` or rely on Keycloak's built-in export

### 4. Update `apps/codever-api/env.json` production config
So `auth-server-url` and Mongo connection point to Docker service names (e.g., `http://keycloak:8080` internally, nginx proxies `/auth` externally).

### 5. Add nginx config
Replicate current reverse proxy rules:
- Proxy `/api` → `codever-api:3000`
- Proxy `/auth` → `keycloak:8080`
- Serve Angular static files for everything else
- Include SSL termination with certbot

### 6. Build the Angular UI for production
Either in a multi-stage Dockerfile or as a CI step (`ng build --configuration production`), and copy the output into the nginx container.

## Further Considerations

1. **Keycloak version jump is the riskiest part** — v16 (WildFly) → v24+ (Quarkus) has breaking config changes. Realm JSON export/re-import is the safest path. Keycloak's DB will be **PostgreSQL** (Keycloak's recommended and best-tested DB). See [keycloak-migration.md](keycloak-migration.md) for the full step-by-step.

2. **Mongo 3.4 → 7.0 via `mongodump`/`mongorestore`** — No need to step through intermediate versions. Dump from 3.4 and restore directly into 7.0 (BSON format is portable). Stepping through versions is only required for in-place data directory upgrades, which we are NOT doing. Test index compatibility after restore (especially weighted text indexes).

3. **Backup & rollback strategy** — keep the old server running in parallel until the new dockerized setup is verified; use DNS switch for the final cutover to minimize downtime. See [dns-cutover.md](dns-cutover.md) for the full DNS/domain switchover plan.

## Related Documents

- [keycloak-migration.md](keycloak-migration.md) — Keycloak v16→v24 with MySQL→PostgreSQL
- [mongo-migration.md](mongo-migration.md) — MongoDB 3.4→7.0 with Docker volumes
- [dns-cutover.md](dns-cutover.md) — DNS A record switch from old Linode to new Linode
- [additional-tasks.md](additional-tasks.md) — Remove S3, env vars, Docker logging, GitHub Actions CI/CD

