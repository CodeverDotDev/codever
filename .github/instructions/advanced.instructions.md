# Codever – Advanced Reference

## API Error Handling

Throw custom error classes from services; Express middleware in `app.js` maps them:

| Class | HTTP |
|---|---|
| `ValidationError` | 400 |
| `UseridValidationError` | 401 |
| `NotFoundError` | 404 |
| `PublicBookmarkExistingError` | 409 |
| `MongoError` code 11000 | 409 |
| `MongoError` other | 503 |

## Frontend HTTP Caching

`HttpClientLocalStorageService` wraps `HttpClient` to cache GET responses in `localStorage`. Pass `HttpOptions` with `key`, `cacheHours`, and `isSensitive` (sensitive entries are cleared on logout).

## Pagination (API)

`PaginationQueryParamsHelper.getPageAndLimit(request)` extracts `page` and `limit` query params on any list endpoint.

## Notes `contentType`

Two render modes: `'markdown'` (default, rendered with `marked`) and `'notebook'` (Jupyter `.ipynb`, stored in `notebookContent` field, rendered via `notebook-renderer` component in the UI). Always set `contentType` when creating/updating notebook notes.

## API Directory Structure

```
apps/codever-api/src/
  app.js              # middleware stack, error handlers, route mounting
  routes/
    public/           # unauthenticated endpoints
    users/
      user.router.js  # history, pinned, read-later, likes, feed, follow/unfollow
      bookmarks/personal-bookmarks.{router,service}.js
      snippets/personal-snippets.{router,service}.js
      notes/personal-notes.{router,service}.js
  model/              # Mongoose schemas
  common/
    searching/        # bookmarks-search.service.js, snippets-search.service.js
    mappers/          # request → domain object
    validation/
  error/
```

## Frontend Directory Structure

```
apps/codever-ui/src/app/
  core/
    model/            # TypeScript interfaces
    cache/            # HttpClientLocalStorageService
  shared/             # reusable components, pipes, directives
  my-bookmarks|my-notes|my-snippets/  # lazy-loaded feature modules
  public/             # lazy-loaded public module
  new-entry/          # unified create component
```

## Dev Infrastructure Details

- Keycloak Admin: http://localhost:8480/auth — `admin/Pa55w0rd`
- On **first** `docker-compose up`: uncomment the migration command in `docker-compose.yml` to import the dev realm; comment it back after.
- API config: `apps/codever-api/env.json` (not committed) — copy from `nodemon.json.example`
- Profile images upload to AWS S3 (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` env vars)
