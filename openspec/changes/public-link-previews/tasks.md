## 1. API

- [ ] 1.1 Add the summary and preview builders (Markdown stripped, 200
  characters at a word boundary, tags as `#tag`, bookmark host fallback,
  generic description when empty) to `link-previews.service.js`; verify with
  a Jest unit test (`link-previews.service.test.js`)
- [ ] 1.2 Write the preview into `index.html` with `cheerio` (title,
  description, `og:*`, `twitter:*`, added when missing, image unchanged,
  escaped values) and load `index.html` from `linkPreviews.indexHtmlPath`
  with a modification-time cache; verify with Jest unit tests including
  `<script>` and quotes in a title
- [ ] 1.3 Add `link-previews.router.js` at `/api/public/link-previews` with
  `GET /notes/:id` and `GET /bookmarks/:id`: entry page for public entries,
  generic page with 200 for private, missing and invalid ids, 503 when the
  page cannot be built, `text/html` and `Cache-Control: no-cache`; verify
  with an integration test on an isolated database
  (`link-previews.integration-test.js`) for public, private, missing,
  invalid id, an edited and a made-private entry
- [ ] 1.4 Add `linkPreviews` to `env.json.example` and document the routes
  in `docs/openapi/openapi.yaml`; verify that `/api/docs` lists them

## 2. Deployment

- [ ] 2.1 Add the two nginx locations and `@spa_index` to
  `nginx/conf.d/codever.dev.conf` and the read-only UI mount to the API
  service in `docker-compose.prod.yml`; verify the nginx config with
  `nginx -t` in an `nginx:stable` container
- [ ] 2.2 Write `documentation/link-previews-deployment.md` (like
  `resource-sharing-deployment.md`) with the deploy and rollback steps and
  the platform preview-refresh tools; verify the steps match design.md

## 3. Checks

- [ ] 3.1 Run the API unit and integration tests; verify they pass without
  new failures
- [ ] 3.2 With the UI built and `linkPreviews.indexHtmlPath` pointing to it,
  request the preview routes for a public note, a public bookmark, a private
  note and a share-link URL with `curl`; verify the tags by observation
