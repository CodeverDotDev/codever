# Codever Agent Guide

## Repository map

- This is a two-app MEAN monorepo: `apps/codever-api` is the Express/Mongoose REST API; `apps/codever-ui` is the Angular 16 SPA. Docker Compose supplies MongoDB and Keycloak (with PostgreSQL for Keycloak).
- The backend starts at `apps/codever-api/bin/www`; middleware, Mongo connection, route mounting, Swagger, body limits, and error mapping are in `apps/codever-api/src/app.js`.
- Backend routes are organized by boundary under `apps/codever-api/src/routes/`: public endpoints, authenticated personal user resources, and admin/feature-toggle endpoints. Follow Router → Service → Mongoose Model; there is no controller layer.
- Personal routes are mounted below `/api/personal/users/:userId`. Preserve the pattern `keycloak.protect()` followed by `userid.validator`/`UserIdValidator.validateUserId(request)` before accessing user data.
- Domain schemas live in `apps/codever-api/src/model/`; shared searching, pagination, mappers, and validation are under `src/common/`. OpenAPI is maintained in `apps/codever-api/docs/openapi/openapi.yaml` and served at `/api/docs`.
- The UI entry routing is `apps/codever-ui/src/app/app.routing.ts`. Feature areas are lazy-loaded (`my-bookmarks`, `my-notes`, `public`, dashboard, settings, search); shared components and reusable services belong in `src/app/shared` and `src/app/core`.
- `/my-snippets` and legacy snippet/codelet URLs intentionally redirect to notes. Do not remove these compatibility routes without checking extensions/bookmarklets and the related migration behavior.

## Local setup and workflows

- Prerequisites are Node 16+ / npm 8+, Docker, and (for backend development) nodemon. Run `npm install` at the root to install both app dependencies.
- Create the ignored API config before starting: `cp apps/codever-api/env.json.example apps/codever-api/env.json` (adapt the command if using PowerShell). Start infrastructure with `docker-compose up`.
- On the first Compose startup only, enable the Keycloak migration/import command in `docker-compose.yml`; comment it back out on later startups. Local Keycloak is at `http://localhost:8480/auth` (`mock/mock`, admin `admin/Pa55w0rd`).
- Run both apps with `npm start`, or separately with `npm run frontend` and `npm run backend`. UI is at `http://localhost:4200`; API is at `http://localhost:3000/api`.
- Backend commands from `apps/codever-api`: `npm test` (Jest unit tests), `npm run test:integration` (requires Docker/Keycloak/Mongo), and `npm run debug` (nodemon with `--inspect`). Test files use `*.test.js` and `*.integration-test.js`.
- Frontend commands from `apps/codever-ui`: `npm test` (Karma/Jasmine), `npm run lint`, `npm run build` / `npm run build:aot`, and `npm run cy:run` or `npm run cy:open` (Cypress; serve the UI and start infrastructure first).
- For a backend port conflict, find the process using port 3000 and terminate it before rerunning `npm run debug`. Attach an IDE Node debugger to nodemon’s inspect process.

## Code and integration rules

- Resource records use `type` (`bookmark` or `note`) and `public: Boolean`; preserve existing resource-specific fields and request-to-domain mappers when adding endpoints.
- Notes use `contentType: 'markdown' | 'notebook'`; notebook notes store `notebookContent` and must set `contentType` on create/update. Markdown is rendered with `marked`; notebook rendering is handled by the UI notebook renderer.
- Services throw project error classes from `apps/codever-api/src/error/`; `app.js` maps validation to 400, user-ID authorization failures to 401, not-found to 404, duplicate conflicts to 409, and other Mongo failures to 503.
- List endpoints should use `PaginationQueryParamsHelper.getPageAndLimit(request)` rather than parsing page/limit independently. Follow existing service and validator naming (`*.service.js`, `*.validator.js`).
- Authentication is Keycloak/OIDC (`keycloak-connect` in the API, `keycloak-angular`/`keycloak-js` in the UI); API/UI realm and URLs are configured in `env.json` and `src/environments/environment.ts`.
- Profile images are uploaded with `multer-s3` to AWS S3; keep AWS credentials and region in environment variables, never source files. API JSON/urlencoded bodies allow 6 MB for notebook uploads, so nginx must also allow `client_max_body_size 6m`.
- Frontend GET caching is centralized in `HttpClientLocalStorageService`; cache options include `key`, `cacheHours`, and `isSensitive`, with sensitive entries cleared on logout.
- Use Angular Commit Guidelines (`feat`, `fix`, `chore`, `refactor`, `docs`, `perf`, etc.) and preserve the existing formatting/style in the touched app.
