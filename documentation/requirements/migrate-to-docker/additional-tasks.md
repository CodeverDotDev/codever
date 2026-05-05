# Additional Migration Tasks
## 1. Remove AWS S3 — Store Profile Images Locally
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
## 2. Environment Variables (.env with placeholders)
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
# Node
NODE_ENV=production
# Uploads
UPLOAD_DIR=/data/codever/uploads/profile-images
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
      UPLOAD_DIR: ${UPLOAD_DIR}
```
> Add `.env` to `.gitignore`.
---
## 3. Logging — Use Docker Logs (no file rotation)
### Why
- `docker logs codever-api` works out of the box
- Docker handles rotation natively
- No log directories to manage on the host
### Change in `app.js`
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
## 4. CI/CD with GitHub Actions (free)
### Free tier
- **Public repos:** unlimited minutes
- **Private repos:** 2,000 min/month free
### Simple approach: SSH deploy on push to master
`.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production
on:
  push:
    branches: [master]
  workflow_dispatch:  # manual trigger from GitHub UI
jobs:
  deploy:
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
            git pull origin master
            # Rebuild and restart API
            docker compose -f docker-compose.prod.yml build codever-api
            docker compose -f docker-compose.prod.yml up -d --no-deps codever-api
            # Rebuild frontend
            cd apps/codever-ui && npm ci && npx ng build --configuration production
            cp -r dist/codever-ui/* /data/codever/nginx/html/
            docker exec codever-nginx nginx -s reload
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
### Manual deploy still works
```bash
ssh deploy@server
cd /opt/codever
git pull
docker compose -f docker-compose.prod.yml build codever-api
docker compose -f docker-compose.prod.yml up -d --no-deps codever-api
```
