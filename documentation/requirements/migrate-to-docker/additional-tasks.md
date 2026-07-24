# Additional Migration Tasks

> Tasks are labeled **[MIGRATION]** (part of the infra phase, no app code changes) or
> **[DEFERRED — Phase 10]** (code changes, done *after* the new infra is stable —
> see [migration-plan.md](migration-plan.md) §5, Phase 10).

## 1. [DEFERRED — Phase 10] Remove AWS S3 — Store Profile Images Locally

> ⚠️ **Not part of this migration.** The brief explicitly preserves S3 profile-image uploads and
> forbids app code changes in this phase. During the migration, simply pass `AWS_ACCESS_KEY_ID`,
> `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` into the `codever-api` container via `.env` (§2) and S3
> keeps working unchanged. The plan below is kept for the later code phase.

### What it does today
- Users upload profile pictures via `POST /api/personal/users/:userId/profile-picture`
- Images stored in AWS S3 bucket `bookmarks.dev` under `user-profile-images/<env>/`
- The S3 URL is returned and saved in the user profile in MongoDB
### Files involved
- `apps/codever-api/src/routes/users/user.router.js` (lines 27-60, 78-90)
- `apps/codever-api/package.json` — deps: `aws-sdk`, `multer-s3`
- `apps/codever-ui/src/app/core/user-data.service.ts` (line ~150)
### Replace with: local filesystem + nginx
Store images on a Docker volume, serve via nginx.
**Backend (`user.router.js`) — replace S3 with disk storage:**
```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/data/codever/uploads/profile-images';
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({
  limits: { fileSize: 1048576 },
  fileFilter: FileTypeValidationHelper.imageFilter,
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const name = `${req.params.userId}_${Date.now()}${path.extname(file.originalname)}`;
      cb(null, name);
    },
  }),
});
```
**Route returns a relative URL (served by nginx):**
```javascript
return response.status(HttpStatus.OK).send({
  url: `/uploads/profile-images/${request.file.filename}`,
});
```
**Docker volumes:**
```yaml
services:
  codever-api:
    volumes:
      - /data/codever/uploads:/data/codever/uploads
  nginx:
    volumes:
      - /data/codever/uploads:/usr/share/nginx/uploads:ro
```
**nginx serves static uploads:**
```nginx
location /uploads/ {
    alias /usr/share/nginx/uploads/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```
**Remove packages:**
```bash
cd apps/codever-api
npm uninstall aws-sdk multer-s3
```
**Migrate existing images (optional):**
- Download from S3 to `/data/codever/uploads/profile-images/`
- Update `imageUrl` in MongoDB `users` collection
- Or let users re-upload if few users affected
---
## 2. [MIGRATION] Environment Variables (.env with placeholders)

Create `.env` on the server (never commit to git):
```bash
# /opt/codever/.env
# MongoDB
MONGO_ADMIN_PASSWORD=CHANGE_ME_MONGO_ADMIN
MONGO_BOOKMARKS_PASSWORD=CHANGE_ME_MONGO_BOOKMARKS
# Keycloak DB (PostgreSQL)
KC_DB_PASSWORD=CHANGE_ME_KC_DB
KC_ADMIN_PASSWORD=CHANGE_ME_KC_ADMIN
# Keycloak Admin API (used by admin router)
KEYCLOAK_SERVER_URL=http://keycloak:8080/auth
KEYCLOAK_REALM=bookmarks
# External API Keys
YOUTUBE_API_KEY=CHANGE_ME_YOUTUBE_KEY
STACK_EXCHANGE_API_KEY=CHANGE_ME_STACK_EXCHANGE_KEY
# AWS S3 (profile images — KEPT during this phase)
AWS_ACCESS_KEY_ID=CHANGE_ME_AWS_KEY_ID
AWS_SECRET_ACCESS_KEY=CHANGE_ME_AWS_SECRET
AWS_REGION=eu-central-1
# Node
NODE_ENV=production
```
In `docker-compose.prod.yml`:
```yaml
services:
  codever-api:
    env_file: .env
    environment:
      MONGODB_BOOKMARKS_USERNAME: bookmarks
      MONGODB_BOOKMARKS_PASSWORD: ${MONGO_BOOKMARKS_PASSWORD}
      MONGODB_BOOKMARKS_COLLECTION: dev-bookmarks
      MONGODB_HOST: mongo
      MONGODB_PORT: "27017"
      YOUTUBE_API_KEY: ${YOUTUBE_API_KEY}
      STACK_EXCHANGE_API_KEY: ${STACK_EXCHANGE_API_KEY}
      KEYCLOAK_SERVER_URL: ${KEYCLOAK_SERVER_URL}
      KEYCLOAK_REALM: ${KEYCLOAK_REALM}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      AWS_REGION: ${AWS_REGION}
```
> Add `.env` to `.gitignore`. `env.json` (keyed by `NODE_ENV`) stays as today and is either baked
> per-server or mounted read-only — it is already git-ignored.
---
## 3. [MIGRATION — minimal, flagged code change] Logging — Use Docker Logs
### Why
- `docker logs codever-api` works out of the box
- Docker handles rotation natively
- No log directories to manage on the host

> ⚠️ **This is an app code change** (removing `rotating-file-stream` from `app.js`), flagged
> explicitly per the brief's "unavoidable changes must be called out" rule. It is small, isolated,
> and containers make file-based rotation pointless.
> **Zero-code alternative:** keep `app.js` untouched and bind-mount the log directory
> (`- /var/log/codever/api:/usr/src/app/log`). Choose one; the code change is recommended.

### Change in `app.js` (recommended)
```javascript
// REMOVE rotating-file-stream setup entirely
// REMOVE: const rfs = require('rotating-file-stream/index');
// REMOVE: fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
// REMOVE: rfs('access.log', {...})
// REMOVE: app.use(logger('combined', { stream: accessLogStream }));
// KEEP only console logging:
app.use(logger('combined'));  // logs to stdout, captured by Docker
```
### Docker Compose log config
```yaml
services:
  codever-api:
    logging:
      driver: json-file
      options:
        max-size: "50m"
        max-file: "5"
```
### Usage
```bash
docker compose logs -f codever-api          # live tail
docker compose logs --tail 100 codever-api  # last 100 lines
docker compose logs codever-api | grep error # search
```
---
## 4. [MIGRATION] CI/CD with GitHub Actions (free)

### Free tier
- **Public repos:** unlimited minutes
- **Private repos:** 2,000 min/month free

### Recommended flow: build → GHCR → `compose pull && up`

Answers the "commit → deployment" stakeholder question (see
[migration-plan.md](migration-plan.md) §6.3): images are built in CI, pushed to GHCR
(`latest` + git-SHA tags), and the server only ever pulls — no Node/Angular toolchain on the server.

`.github/workflows/deploy.yml`:
```yaml
name: Build and Deploy to Production
on:
  push:
    branches: [master]
  workflow_dispatch:  # manual trigger from GitHub UI
jobs:
  build-push:
    runs-on: ubuntu-latest
    permissions: { contents: read, packages: write }
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build & push API image
        uses: docker/build-push-action@v6
        with:
          context: apps/codever-api
          push: true
          tags: |
            ghcr.io/${{ github.repository_owner }}/codever-api:latest
            ghcr.io/${{ github.repository_owner }}/codever-api:${{ github.sha }}
      - name: Build & push UI image (multi-stage: ng build → nginx)
        uses: docker/build-push-action@v6
        with:
          context: apps/codever-ui
          push: true
          tags: |
            ghcr.io/${{ github.repository_owner }}/codever-ui:latest
            ghcr.io/${{ github.repository_owner }}/codever-ui:${{ github.sha }}
  deploy:
    needs: build-push
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_IP }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/codever
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml up -d
```

### Simpler alternative / manual fallback: build on the server

No registry involved — good as a fallback if CI is down, or as the initial setup before CI exists:
```bash
ssh deploy@server
cd /opt/codever
git pull origin master
docker compose -f docker-compose.prod.yml build codever-api
docker compose -f docker-compose.prod.yml up -d --no-deps codever-api
# UI (if not using the UI image): build locally/CI and copy dist to /data/codever/ui-dist,
# then: docker exec codever-nginx nginx -s reload
```

### GitHub Secrets to set
Repo > Settings > Secrets > Actions:
| Secret | Value |
|---|---|
| `SERVER_IP` | New Linode IP |
| `SERVER_USER` | `deploy` |
| `SSH_PRIVATE_KEY` | SSH private key for deploy user |
### Server prep
```bash
# Create deploy user with Docker access
sudo adduser deploy
sudo usermod -aG docker deploy
# Clone repo
sudo mkdir -p /opt/codever && sudo chown deploy:deploy /opt/codever
su - deploy
git clone https://github.com/CodeverDotDev/codever.git /opt/codever
# Set up SSH key for GitHub Actions
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N ""
cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys
# Copy private key content to GitHub Secret: SSH_PRIVATE_KEY
```

---
## 5. Auth adapters

### 5.1 [MIGRATION — REQUIRED code change] Logout fix for Keycloak 24

> ⚠️ Found in the local compatibility gate (2026-07-24). This is the migration's **one unavoidable
> app code change**, flagged per the brief's rule.

**Symptom:** clicking *Logout* lands on Keycloak's error page `Invalid parameter: redirect_uri`
(URL contains `…/logout?redirect_uri=…`).

**Cause:** Keycloak 18 replaced the legacy `redirect_uri` logout parameter with
`post_logout_redirect_uri` + `id_token_hint` (OIDC RP-Initiated Logout spec). `keycloak-js 12`
predates this and still sends `redirect_uri`. KC 18–23 offered a server-side compatibility switch
(`--spi-login-protocol-openid-connect-legacy-logout-redirect-uri=true`), but it was **removed in
Keycloak 24** — so no server configuration can fix this.

**Fix (applied):** two paired changes:

1. `apps/codever-ui/src/app/shared/navigation/navigation.component.ts` — `doLogout()` builds the
   OIDC-compliant logout URL manually instead of calling `keycloakService.logout()`:
   `…/protocol/openid-connect/logout?post_logout_redirect_uri=<APP_HOME_URL>&id_token_hint=<idToken>`
2. Realm export — the `bookmarks` client needs the attribute
   `"post.logout.redirect.uris": "+"` (did not exist in KC 16 exports); see
   [keycloak-migration.md](keycloak-migration.md) Step 1b.

This workaround becomes obsolete once `keycloak-js` is upgraded (§5.2), which handles the new
logout parameters natively.

### 5.2 [DEFERRED — Phase 10] Auth adapter modernization

> Recorded here so it isn't lost; **do not do this during the migration**
> (see [keycloak-migration.md](keycloak-migration.md), Step 6).

Replace/upgrade `keycloak-connect@16.1.1` (deprecated upstream) with a newer `keycloak-connect`
or a generic OIDC middleware (`express-openid-connect`, `passport-openidconnect`).
Files that need changes (7 files):

- `src/routes/admin/admin.router.js`
- `src/routes/users/user.router.js`
- `src/routes/users/bookmarks/personal-bookmarks.router.js`
- `src/routes/users/snippets/personal-snippets.router.js`
- `src/routes/users/notes/personal-notes.router.js`
- `src/routes/users/userid.validator.js`
- `src/routes/webpage-info/webpage-info.router.js`

On the UI side: upgrade `keycloak-js` / `keycloak-angular` together with the Angular upgrade.

### 5.3 [REJECTED for migration — revisit only if ever worth it] Rename realm `bookmarks` → `codever`

Considered during the migration (2026-07-24) and **explicitly deferred**:

- The realm name is part of every auth URL (`/auth/realms/bookmarks/...`) — i.e., the token
  **issuer** — hardcoded not only in `env.json` (4 blocks) and the UI `environment*.ts` files
  (4 files), but also in the separately-published **browser extensions and IDE plugins**.
  A rename breaks every installed client until users update.
- During the migration it would change two variables at once (KC 16→24 *and* the issuer),
  invalidate the passed compatibility gate, and degrade the DNS rollback path (old server
  still serves realm `bookmarks`).
- Benefit is purely cosmetic → not worth it now; questionable even later.

