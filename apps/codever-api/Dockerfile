# Production image for the Codever API (built by docker-compose.prod.yml).
# node:22-slim = maintained LTS (until 2027-04; node 20 went EOL 2026-04) verified
# against the pinned deps (mongoose 5, keycloak-connect 16, aws-sdk v2, express 4).
FROM node:22-slim

# set our node environment, either development or production
# defaults to production, compose overrides this to development on build and run
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

# default to port 3000 for node, and 9229 and 9230 (tests) for debug
ARG PORT=3000
ENV PORT=$PORT
EXPOSE $PORT 9229 9230

# install dependencies first, in a different location for easier app bind mounting for local development
# due to default /opt permissions we have to create the dir with root and change perms
RUN mkdir /opt/node_app && chown node:node /opt/node_app
WORKDIR /opt/node_app

# the official node image provides an unprivileged user as a security best practice
# but we have to manually enable it. We put it here so npm installs dependencies as the same
# user who runs the app.
# https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md#non-root-user
USER node
COPY --chown=node:node package.json package-lock.json* ./
# production deps only — no devDependencies (nodemon/jest) in the image
RUN npm ci --omit=dev --no-optional && npm cache clean --force
ENV PATH=/opt/node_app/node_modules/.bin:$PATH

# copy in our source code last, as it changes the most
WORKDIR /opt/node_app/app
COPY --chown=node:node . .

# exec form (no shell wrapper) so SIGTERM reaches Node directly → graceful shutdown;
# Docker's restart policy replaces pm2 (migration plan §6.1)
CMD [ "node", "./bin/www" ]
