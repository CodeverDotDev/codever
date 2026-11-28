# Link previews deployment

Public note pages (`/notes/:id/details`, `/notes/:id`) and public bookmark
pages (`/bookmarks/:id/...`) get link-preview tags with the entry's title,
a short plain-text summary and its tags. nginx sends these URLs to the API
(`/api/public/link-previews/{notes,bookmarks}/:id`), which writes the tags
into the deployed `index.html`. Share links, tag lists and all other pages
keep the generic preview. Private, missing and invalid entries get the
unchanged generic page with 200. How it works in detail is described in
[link-previews-how-it-works.md](link-previews-how-it-works.md).

## Deployment

1. Add `linkPreviews` to the production section of the server's
   `apps/codever-api/env.json`:

   ```json
   "linkPreviews": {
     "indexHtmlPath": "/opt/codever-ui/index.html",
     "siteBaseUrl": "https://www.codever.dev"
   }
   ```

   `siteBaseUrl` builds `og:url`. A relative `indexHtmlPath` is resolved
   against the API folder (used in development, see `env.json.example`).

2. Deploy the API with the updated `docker-compose.prod.yml`. It mounts the
   Angular build nginx serves into the API container, read-only:

   ```yaml
   - /data/codever/ui-dist/browser:/opt/codever-ui:ro
   ```

   ```bash
   docker compose -f docker-compose.prod.yml up -d --build codever-api
   ```

   The API re-reads `index.html` when its modification time changes, so a
   later UI deploy needs no API restart.

3. Check the API route directly for a public note before touching nginx:

   ```bash
   docker exec codever-api node -e "require('http').get(\
   'http://localhost:3000/api/public/link-previews/notes/<public-note-id>',\
    r => { let b = ''; r.on('data', c => b += c);\
    r.on('end', () => console.log(r.statusCode,\
    b.match(/<meta property=\"og:[a-z]+\"[^>]*>/g))) })"
   ```

   Expect 200 and `og:title`, `og:description`, `og:url` and `og:type` for
   the note.

4. Deploy the nginx configuration (`nginx/conf.d/codever.dev.conf`), test it
   and reload:

   ```bash
   docker exec codever-nginx nginx -t
   docker exec codever-nginx nginx -s reload
   ```

## Release checks

- `curl -s https://www.codever.dev/notes/<public-note-id>/details | grep og:`
  shows the note's title, summary with `#tags` and canonical `og:url`.
- The same for `/bookmarks/<public-bookmark-id>`; a bookmark without a
  description shows the host of its URL as summary.
- A private note's page and a share link (`/notes/shared/<token>`) return
  the generic tags and no entry content.
- The pages still load and work in the browser (logged in and out).
- Stop the API briefly (or test on staging): public note pages must still
  load with the generic tags, served by nginx's static fallback.
- Paste a public note URL into the preview tools below.

## Refreshing platform previews

Platforms cache link previews. After editing an entry, or for links shared
before this release, ask the platform to fetch the page again:

- Facebook / Meta: https://developers.facebook.com/tools/debug/
  ("Scrape Again")
- LinkedIn: https://www.linkedin.com/post-inspector/
- X (Twitter) re-fetches cards on its own after some time; there is no
  public refresh tool.
- Slack, Teams, Discord and messengers re-fetch after their own cache
  expires; sharing the URL with a harmless query string (for example
  `?v=2`) forces a new fetch.

## Rollback

Remove the two link-preview locations and `@spa_index` from
`nginx/conf.d/codever.dev.conf`, then `nginx -t` and reload. nginx serves the
static `index.html` for these URLs again and the API route is no longer used.
The API, its `linkPreviews` setting and the read-only mount can stay; remove
them with the next API deploy if wanted.
