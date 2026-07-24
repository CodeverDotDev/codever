# `docker-compose.prod.yml` Design + nginx Config + TLS

> Covers Deliverables 3 (compose design), 5 (proxy config reproducing the current prod rules) and
> 6 (TLS issuance & auto-renewal) from [refined-brief.md](refined-brief.md).
> Entry point: [migration-plan.md](migration-plan.md).

---

## 1. Design Principles

- **No app code changes** — the stack must run the current codebase as-is.
- Only **nginx** exposes ports (80/443); all other services live on a private network.
- **Bind mounts** for data you want to find/back up easily (`/data/codever/...`), named volumes acceptable for Postgres.
- Every service has a **healthcheck** and `restart: unless-stopped` (replaces pm2 supervision and survives host reboots).
- Secrets come from a server-side `.env` file (see [additional-tasks.md](additional-tasks.md) §2) — never committed.

## 2. Service Overview

| Service | Image | Exposed | Volumes | Depends on |
|---|---|---|---|---|
| `nginx` | `nginx:stable` | **80, 443** | UI build (static), certs, certbot webroot, nginx conf | `codever-api`, `keycloak` |
| `certbot` | `certbot/certbot` | — | certs, certbot webroot | — |
| `codever-api` | built from `apps/codever-api/Dockerfile` (`node:20-slim`) | — (internal :3000) | `env.json` (or pure env vars) | `mongo` |
| `keycloak` | `quay.io/keycloak/keycloak:24.0` | — (internal :8080) | realm import dir, custom theme | `postgres` |
| `postgres` | `postgres:16-alpine` | — | `postgres_data` | — |
| `mongo` | `mongo:5.0` | — (internal :27017) | `/data/codever/mongodb`, `init-mongo.js` | — |

## 3. `docker-compose.prod.yml` (reference implementation)

```yaml
name: codever

networks:
  backend:

volumes:
  postgres_data:

services:

  nginx:
    image: nginx:stable
    container_name: codever-nginx
    restart: unless-stopped
    networks: [backend]
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d:ro                # codever.dev server blocks (§4)
      - /data/codever/ui-dist:/usr/share/nginx/html:ro     # Angular prod build
      - /etc/letsencrypt:/etc/letsencrypt:ro               # certs (shared with certbot)
      - /data/codever/certbot-webroot:/var/www/certbot:ro  # ACME http-01 webroot
    healthcheck:
      test: ["CMD", "curl", "-fsk", "https://localhost/"]
      interval: 30s
      timeout: 5s
      retries: 3
    depends_on:
      - codever-api
      - keycloak

  certbot:
    image: certbot/certbot
    container_name: codever-certbot
    restart: unless-stopped
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt
      - /data/codever/certbot-webroot:/var/www/certbot
    # check twice a day; renew when <30 days remain (certbot default)
    entrypoint: >
      /bin/sh -c 'trap exit TERM;
      while :; do certbot renew --webroot -w /var/www/certbot --quiet; sleep 12h & wait $${!}; done'

  codever-api:
    build: ./apps/codever-api          # or image: ghcr.io/codeverdotdev/codever-api:<tag> when using CI
    container_name: codever-api
    restart: unless-stopped
    networks: [backend]
    env_file: .env
    environment:
      NODE_ENV: production
      MONGODB_HOST: mongo              # Docker service name, not localhost
      MONGODB_PORT: "27017"
    logging:
      driver: json-file
      options: { max-size: "50m", max-file: "5" }
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/version', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"]
      interval: 30s
      timeout: 5s
      retries: 3
    depends_on:
      mongo:
        condition: service_healthy

  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    container_name: codever-keycloak
    restart: unless-stopped
    networks: [backend]
    environment:
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: ${KC_DB_PASSWORD}
      KC_HOSTNAME: https://www.codever.dev/auth
      KC_HTTP_RELATIVE_PATH: /auth       # CRITICAL: keeps keycloak-js 12 + nginx /auth/ working
      KC_HTTP_ENABLED: "true"            # plain HTTP inside the Docker network
      KC_PROXY_HEADERS: xforwarded       # trust X-Forwarded-* from nginx
      KC_BOOTSTRAP_ADMIN_USERNAME: admin # first boot only
      KC_BOOTSTRAP_ADMIN_PASSWORD: ${KC_ADMIN_PASSWORD}
    command: start                       # first run only: start --import-realm
    volumes:
      - ./docker-compose-setup/keycloak-export-import:/opt/keycloak/data/import:ro
      - ./apps/codever-keycloak-theme/codever:/opt/keycloak/themes/codever:ro
    healthcheck:
      test: ["CMD-SHELL", "exec 3<>/dev/tcp/localhost/8080 && echo -e 'GET /auth/health/ready HTTP/1.1\\r\\nHost: localhost\\r\\n\\r\\n' >&3 && head -1 <&3 | grep 200"]
      interval: 30s
      timeout: 5s
      retries: 5
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    container_name: codever-postgres
    restart: unless-stopped
    networks: [backend]
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: ${KC_DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U keycloak"]
      interval: 10s
      timeout: 5s
      retries: 5

  mongo:
    image: mongo:5.0                     # ceiling for mongoose ^5.13 — do NOT bump without code phase
    container_name: codever-mongo
    restart: unless-stopped
    networks: [backend]
    environment:
      MONGO_INITDB_DATABASE: dev-bookmarks
      MONGO_INITDB_ROOT_USERNAME: mongoadmin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ADMIN_PASSWORD}
    volumes:
      - /data/codever/mongodb:/data/db   # bind mount → obvious backup location
      - ./docker-compose-setup/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
    command: ["mongod", "--auth", "--bind_ip_all"]
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
```

Notes:

- **API port is not published** — nginx reaches it via the `backend` network. Same for Keycloak and Mongo
  (temporarily publish `27017` only while running `mongorestore`, then remove).
- `codever-api` keeps reading `env.json` keyed by `NODE_ENV` exactly as today; the production block just
  points at Docker service names (`mongo`, `http://keycloak:8080/auth`). Alternatively mount `env.json`
  read-only: `- ./apps/codever-api/env.json:/usr/src/app/env.json:ro`.
- **AWS S3 stays**: pass `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` through `.env`
  (profile-image upload keeps working with zero code changes).

## 4. API Dockerfile reconciliation

The committed `apps/codever-api/Dockerfile` says `FROM node:10-slim` while prod actually runs Node 16.
Update (this is a Dockerfile fix, not an app-code change):

```dockerfile
FROM node:20-slim
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
# exec form → SIGTERM reaches node directly (graceful shutdown, no pm2 needed)
CMD ["node", "bin/www"]
```

## 5. nginx configuration (reproduces §2.4 of the brief verbatim)

`nginx/conf.d/codever.dev.conf` — this is the current prod config from
[input-context.md](input-context.md), adapted only where Docker requires it
(upstreams point at service names, cert paths under `/etc/letsencrypt`):

```nginx
upstream keycloak_server {
    server keycloak:8080;        # was 127.0.0.1:8180
}

upstream node_server {
    server codever-api:3000;     # was 127.0.0.1:3000
}

# Expires map — carried over unchanged
map $sent_http_content_type $expires {
    default                    off;
    text/html                  epoch;
    text/css                   max;
    application/javascript     max;
    application/font-woff2     max;
    ~image/                    30d;
}

# HTTP → HTTPS (+ ACME webroot passthrough must stay reachable over plain HTTP)
server {
    listen 80 default_server;
    server_name codever.dev www.codever.dev;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    return 301 https://www.codever.dev$request_uri;
}

# apex → www for HTTPS
server {
    listen 443 ssl;
    server_name codever.dev;

    ssl_certificate     /etc/letsencrypt/live/codever.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/codever.dev/privkey.pem;

    return 301 https://www.codever.dev$request_uri;
}

server {
    listen 443 ssl default_server;
    server_name www.codever.dev;

    ssl_certificate     /etc/letsencrypt/live/codever.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/codever.dev/privkey.pem;
    # + the hardening from the old snippets/ssl-params.conf (protocols, ciphers, HSTS)

    expires $expires;

    root  /usr/share/nginx/html;
    index index.html;

    # SPA fallback — unchanged
    error_page 404 =200 /index.html;

    # gzip + header hardening carried over from old nginx.conf http{} block
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    add_header X-Frame-Options SAMEORIGIN always;
    large_client_header_buffers 8 16k;   # avoids HTTP 414 on long URIs

    # ---------------------------------------------------------------
    # Permanent 301 redirects: snippets → notes (Phase 2 migration)
    # CARRIED OVER VERBATIM — more-specific rules first
    # ---------------------------------------------------------------
    rewrite ^/snippets/([^/]+)/details$  /notes/$1/details  permanent;
    rewrite ^/snippets/([^/]+)$          /notes/$1          permanent;
    rewrite ^/my-snippets(/.*)?$         /my-notes$1        permanent;
    rewrite ^/404-snippet$               /404-note          permanent;
    # ---------------------------------------------------------------

    location / {
        try_files $uri$args $uri$args/ /index.html;
    }

    # Let's Encrypt webroot
    location ~ /.well-known {
        root /var/www/certbot;
        allow all;
    }

    location /auth/ {
        proxy_pass http://keycloak_server;
        proxy_http_version 1.1;
        proxy_set_header Host               $host;
        proxy_set_header X-Real-IP          $remote_addr;
        proxy_set_header X-Forwarded-For    $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto  $scheme;
        proxy_set_header X-Forwarded-Host   $host;
        proxy_set_header X-Forwarded-Port   $server_port;
        # enlarged buffers — avoids bad gateway when the Chrome extension
        # posts bookmarks with large descriptions (carried over unchanged)
        proxy_buffer_size          128k;
        proxy_buffers              4 256k;
        proxy_busy_buffers_size    256k;
    }

    location /api/ {
        client_max_body_size 6m;
        proxy_pass http://node_server/api/;
        proxy_set_header Host               $host;
        proxy_set_header X-Real-IP          $remote_addr;
        proxy_set_header X-Forwarded-For    $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto  $scheme;
    }
}
```

### Rule-by-rule traceability vs current prod

| Current prod rule (brief §2.4) | Where reproduced |
|---|---|
| HTTP→HTTPS + apex→www 301 | first two `server` blocks |
| SPA `try_files … index.html` + `error_page 404 =200` | `location /` + `error_page` |
| `/auth/` proxy + enlarged buffers | `location /auth/` |
| `/api/` proxy + `client_max_body_size 6m` | `location /api/` |
| `/.well-known` passthrough | dedicated locations (HTTP + HTTPS) |
| snippets→notes 301 rewrites | verbatim `rewrite` block |
| expires map / gzip / X-Frame-Options / large_client_header_buffers | carried into server block |

## 6. TLS: issuance & auto-renewal in Docker

### 6.1 Initial issuance — BEFORE DNS cutover (zero cert gap)

Use the **DNS-01 challenge** on the new server so the cert exists before the domain points there
(details & TXT-record flow in [dns-cutover.md](dns-cutover.md)):

```bash
docker run -it --rm -v /etc/letsencrypt:/etc/letsencrypt certbot/certbot certonly \
  --manual --preferred-challenges dns \
  -d codever.dev -d www.codever.dev
```

### 6.2 Ongoing renewal — automatic (webroot / HTTP-01)

After cutover the domain resolves to the new server, so the `certbot` sidecar service (§3) renews via
the shared webroot automatically every ≤12h check. nginx must reload to pick up renewed certs:

```bash
# host cron (or a deploy-hook): reload nginx twice a month after potential renewals
0 4 1,15 * * docker exec codever-nginx nginx -s reload
```

(Alternative: add `--deploy-hook "docker kill -s HUP codever-nginx"` logic via a shared docker.sock —
the simple cron reload is less magic and good enough.)

### 6.3 Verification

```bash
docker run --rm -v /etc/letsencrypt:/etc/letsencrypt \
  -v /data/codever/certbot-webroot:/var/www/certbot \
  certbot/certbot renew --dry-run --webroot -w /var/www/certbot
```

## 7. UI build & delivery

Two supported modes (see [additional-tasks.md](additional-tasks.md) §4 for the CI wiring):

1. **CI-built static bundle (simplest):** GitHub Actions runs
   `ng build --configuration production` and rsyncs/copies `dist/` to `/data/codever/ui-dist` on the
   server; nginx serves it directly (matches today's mental model, minus the manual upload).
2. **Immutable UI image:** multi-stage Dockerfile (`node:20` build stage → `nginx:stable` runtime
   stage with the nginx config baked in) pushed to GHCR; compose then uses
   `image: ghcr.io/…/codever-ui` instead of mounting `conf.d` + `ui-dist`.

Start with mode 1; switch to mode 2 once CI is trusted.

