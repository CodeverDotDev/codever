# How link previews work

Platforms such as Slack, X, LinkedIn, Teams or WhatsApp build a link preview
by fetching the shared URL and reading the `<title>` and the Open Graph
(`og:*`) and Twitter (`twitter:*`) tags from the HTML. They don't run
JavaScript. Codever is an Angular single-page app, so without help they only
ever see the static `index.html` with the generic Codever tags, whatever entry
the URL points to.

For public note and bookmark pages, the entry's details are now written into
that HTML on the server, before it is sent.

For deployment, release checks and rollback see
[link-previews-deployment.md](link-previews-deployment.md).

## Request flow

```
 Platform / browser
        |
        |  GET https://www.codever.dev/notes/<24-hex id>/details
        v
 +-------------------------------------------------------------+
 | nginx                                                       |
 |                                                             |
 |  /notes/<24-hex id>[/details]   --+                         |
 |  /bookmarks/<24-hex id>[/...]   --+--> proxy to the API     |
 |                                                             |
 |  everything else (share links, /bookmarks/t/java, /feed...) |
 |      --> static index.html, generic tags (unchanged)        |
 +-------------------------------------------------------------+
        |
        v
 +-------------------------------------------------------------+
 | API  GET /api/public/link-previews/notes/:id                |
 |      GET /api/public/link-previews/bookmarks/:id            |
 |                                                             |
 |  1. read index.html (the same build nginx serves,           |
 |     cached until the file changes)                          |
 |  2. look up the entry; only public entries are found        |
 |  3. public -> write its tags into the page  -> 200          |
 |     private / missing / bad id -> generic page -> 200       |
 |     anything broken (DB, file) -> 503                       |
 +-------------------------------------------------------------+
        |
        v
 nginx: 200 -> pass the page on
        503 / API down / no answer within 3s
            -> serve the static index.html instead
```

The pieces:

- nginx: the two regex locations and `@spa_index` in
  `nginx/conf.d/codever.dev.conf`.
- API: `apps/codever-api/src/routes/public/link-previews.router.js` and
  `link-previews.service.js`.
- Configuration: `linkPreviews.indexHtmlPath` and `linkPreviews.siteBaseUrl`
  in `apps/codever-api/env.json`.
- Production: `docker-compose.prod.yml` mounts the UI build read-only into the
  API container at `/opt/codever-ui`.

## What a public note's page contains

```html
<title>Docker cleanup</title>
<meta name="description"         content="Run docker system prune often. #docker #devops">
<meta property="og:title"        content="Docker cleanup">
<meta property="og:description"  content="Run docker system prune often. #docker #devops">
<meta property="og:url"          content="https://www.codever.dev/notes/<id>/details">
<meta property="og:type"         content="article">
<meta property="og:image"        content="...codever-og-image.jpeg">   (unchanged)
<meta name="twitter:card"        content="summary_large_image">
<meta name="twitter:title" / "twitter:description"                      (same values)
```

- **Title:** the note title or bookmark name.
- **Summary:** the note content or bookmark description with Markdown
  removed (code blocks and images dropped; links, emphasis, headings, lists
  and quotes reduced to their text), cut to 200 characters at a word boundary
  with "…", followed by the tags as `#tag`.
- **Bookmark without a description:** the summary is its site's host (for
  example `kubernetes.io`) plus the tags.
- **No text and no tags:** the generic Codever description stays.
- **URL:** `og:url` is the canonical page, `/notes/<id>/details` or
  `/bookmarks/<id>`.
- **Image:** always the standard Codever image.
- Values are HTML-escaped, so a title can't inject markup.

## What stays the same

- **The app:** the rest of the HTML is identical, so the browser loads the
  Angular app as before and the page works normally. People and crawlers get
  the same page; there is no crawler detection.
- **Privacy:** a private note's URL returns exactly the generic page with
  200, the same as a missing one, so you can't tell whether a private entry
  with that id exists.
- **Share links:** `/notes/shared/...` and `/bookmarks/shared/...` never reach
  the API route (`shared` isn't a 24-character id), so they keep the generic
  preview.
- **Other pages:** tag lists, search, the feed and all other routes are
  served by nginx as before.
- **Failures:** if the API is down or something fails, nginx serves the
  static page, so it's never worse than before. A slow or hung API is cut
  off after 3 seconds (`proxy_read_timeout`, 2 seconds to connect), so a
  full page load waits at most that long before getting the static page.

## Updates

- **Edits:** every request reads the entry as currently stored, so an edit or
  making an entry private shows up on the next fetch.
- **UI deploys:** the API notices when `index.html` changes (modification
  time), so a UI deploy needs no API restart.
- **Platform caches:** platforms cache previews themselves. After an edit, use
  the refresh tools listed in
  [link-previews-deployment.md](link-previews-deployment.md#refreshing-platform-previews)
  (Facebook debugger, LinkedIn Post Inspector), or share the link with a
  harmless query string such as `?v=2`.

## Deploying in short

1. Add `linkPreviews` to the production `env.json`.
2. Deploy the API with the read-only mount of the UI build.
3. Check the API route with `curl` on the server.
4. Deploy the nginx config, run `nginx -t`, and reload.

To roll back, remove the two nginx locations and `@spa_index`, then reload
nginx.
