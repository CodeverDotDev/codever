## Context

See proposal.md - Why. Current state:

- In production nginx serves the Angular browser build from
  `/data/codever/ui-dist/browser` (mounted at `/usr/share/nginx/html`) with
  an SPA fallback to `index.html`; `/api/` is proxied to the API container.
- `apps/codever-ui/src/index.html` carries fixed `description`, `og:*` and
  `twitter:*` tags and `<title>Codever</title>`; there is no `og:url`,
  `og:type` or `twitter:card`.
- Public pages: `/notes/:id/details` (`/notes/:id` redirects to it) and
  `/bookmarks/:id` with any sub-path. Share links live under
  `/notes/shared/:token` and `/bookmarks/shared/:token`; `/bookmarks/t/:tag`
  and its aliases are tag lists. Entry ids are 24-character hex ObjectIds.
- The API reads public entries with `PublicNotesService.getNoteById` and
  `PublicBookmarksService.getBookmarkById`, which throw `NotFoundError` for
  private or missing entries. `cheerio` is already an API dependency.

## Goals / Non-Goals

**Goals:**

- Entry-specific preview tags for public note and bookmark pages, with the
  same page HTML for every visitor (no user-agent detection).
- Never worse than today: any failure serves the generic page.

**Non-Goals:**

- Server-side rendering of the page content, SEO beyond the preview tags.
- Per-entry preview images.
- Previews for share links, tag lists, user profiles or other pages.

## Decisions

### nginx routes public entry pages to an API route that serves the HTML

nginx gets two regex locations, matched only for a 24-hex id so share links,
tag lists and other paths keep the static page:

```nginx
location ~ "^/notes/(?<entry_id>[0-9a-fA-F]{24})(?:/details)?/?$" {
    proxy_pass http://node_server/api/public/link-previews/notes/$entry_id;
    proxy_intercept_errors on;
    error_page 500 502 503 504 = @spa_index;
}
location ~ "^/bookmarks/(?<entry_id>[0-9a-fA-F]{24})(?:/.*)?$" {
    proxy_pass http://node_server/api/public/link-previews/bookmarks/$entry_id;
    proxy_intercept_errors on;
    error_page 500 502 503 504 = @spa_index;
}
location @spa_index {
    try_files /index.html =404;
}
```

The `upstream node_server` block means no `resolver` is needed for the
variable in `proxy_pass`. The existing `expires` map already marks
`text/html` as not cacheable.

Alternatives considered:

- Angular SSR: renders everything, but Keycloak, `localStorage` and direct
  `window` use across the app would need guarding, and the UI would need its
  own Node server. Far larger than the need.
- Serving preview HTML only to crawler user agents: smaller responses, but
  the list of agents is never complete and people and bots would see
  different pages.
- Prerendering: entries are created continuously.

### Router -> Service, reading public entries only

`routes/public/link-previews.router.js`, mounted at
`/api/public/link-previews` without `keycloak.protect()` (public, like the
other `/api/public` routes), offers `GET /notes/:id` and
`GET /bookmarks/:id`. `link-previews.service.js`:

- loads `index.html` from `config.linkPreviews.indexHtmlPath`, cached in
  memory and reloaded when the file's modification time changes, so a UI
  deploy is picked up without restarting the API;
- reads the entry through the existing public services, so only `public:
  true` entries are used;
- builds `{ title, description, url }` and writes it into the page with
  `cheerio` (`<title>`, `description`, `og:title`, `og:description`,
  `og:url`, `og:type`, `twitter:card`, `twitter:title`,
  `twitter:description`), adding the tags that are missing. `og:image` and
  `twitter:image` stay as built.

The router answers `NotFoundError` and Mongoose `CastError` with the generic
page and HTTP 200 (as nginx does today for unknown URLs), and any other
error, including a missing `index.html`, with HTTP 503 so nginx serves the
static page. It handles errors itself instead of the JSON error handlers in
`app.js`. Responses use `Content-Type: text/html; charset=utf-8` and
`Cache-Control: no-cache`.

### Summary text

The summary is built from the note `content` or the bookmark `description`
(both Markdown): code blocks and images are removed, inline code, links,
emphasis, headings, list and quote markers and HTML tags are reduced to
their text, whitespace is collapsed, and the result is cut to 200 characters
at a word boundary with "…". Tags follow as `#tag` separated by spaces. A
bookmark without a description uses the host of its `location`. Notebook
notes use their `content` if any, otherwise only the tags. A small
dependency-free stripper is enough for a preview; a full Markdown renderer
would be added only for this.

### Configuration

`env.json` gets `linkPreviews: { indexHtmlPath, siteBaseUrl }`; the base URL
builds `og:url` (`https://www.codever.dev` in production,
`http://localhost:4200` in development). In production the API container
mounts `/data/codever/ui-dist/browser` read-only (for example at
`/opt/codever-ui`), the same folder nginx serves, so the tags are always
written into the deployed `index.html`.

No UI change: the browser loads the same app, and nothing is cached in
`localStorage`.

## Risks / Trade-offs

- [Extra API work per public page view] → one indexed `findOne` by id and an
  in-memory template; small next to the API calls the app makes anyway.
- [API down or slow] → nginx serves the static page on 5xx and connection
  errors; `proxy_read_timeout` can be lowered for these locations if needed.
- [Platforms cache previews] → after an edit a platform may show the old
  preview until it fetches again; X, LinkedIn and Facebook offer tools to
  refresh. Documented, not solved.
- [Escaping] → all values are set through `cheerio` attribute and text APIs,
  which escape them; covered by a test with `<script>` and quotes.
- [Index file and API out of sync] → the API reads the same folder nginx
  serves, so they cannot drift.

## Migration Plan

1. Deploy the API with the new route and `linkPreviews` in `env.json`, and
   add the read-only UI mount to the API service in
   `docker-compose.prod.yml`.
2. Check `curl https://www.codever.dev/api/public/link-previews/notes/<id>`
   for a public note.
3. Add the nginx locations, run `nginx -t` in the container and reload.
4. Rollback: remove the nginx locations and reload; the API route is unused
   then.
