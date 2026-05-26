# Codever – Copilot Instructions

Codever is a MEAN-stack bookmarks, snippets, and notes manager. Monorepo with two apps:

- `apps/codever-api` — Express.js REST API (Node.js, MongoDB/Mongoose, Keycloak)
- `apps/codever-ui` — Angular 16 SPA (lazy-loaded modules, Angular Material + Bootstrap 4)

## Commands

### Root

```bash
npm run frontend     # ng serve → http://localhost:4200
npm run backend      # nodemon --inspect → http://localhost:3000/api
npm start            # both in parallel
```

### Backend (`apps/codever-api`)
```bash
npm test                                                              # unit tests (*.test.js)
npm run test:integration                                              # requires Docker
npx jest --testPathPattern="userid.validator"                        # single unit test
npx jest --config jest.config.integration.js --testPathPattern="…"  # single integration test
```

### Frontend (`apps/codever-ui`)
```bash
ng lint
ng test              # Karma/Jasmine
npm run cy:run       # Cypress E2E headless — requires Docker
```

### Infrastructure

```bash
docker-compose up    # MongoDB + Keycloak (default dev user: mock/mock)
```

## Architecture

**API** follows Router → Service → Mongoose Model (no controller layer).
- Public routes: `/api/public/{bookmarks,snippets,notes,users}`
- Personal routes: `/api/personal/users/:userId/{bookmarks,snippets,notes}`
- Every personal route calls `keycloak.protect()` then `UserIdValidator.validateUserId(request)`

**Three core resource types** share a `type` field (`'bookmark'`/`'snippet'`/`'note'`) and `public: Boolean`:
- Bookmark: `name`, `location` (URL), `description`, `tags[]`
- Snippet: `title`, `codeSnippets[]` (`code`, `language`, `comment`), `tags[]`
- Note: `title`, `content`, `contentType` (`'markdown'`|`'notebook'`), `tags[]`

**Frontend**: feature modules lazy-loaded via `loadChildren` in `app.routing.ts`; services live in `core/`; shared components in `shared/`.

## Conventions

- Commits: Angular Commit Guidelines (`feat`, `fix`, `chore`, `refactor`, `docs`, `perf`, …)
- Test files: `*.test.js` (unit) and `*.integration-test.js` (integration)
- Config: `apps/codever-api/env.json` keyed by `NODE_ENV` (not committed)
