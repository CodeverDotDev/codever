## Why

When a public note or bookmark page is shared on Slack, X, LinkedIn,
WhatsApp, Discord or similar platforms, the link preview shows the generic
Codever title, description and image. Those platforms read the Open Graph
and Twitter tags from the HTML without running JavaScript, and every page of
the Angular app is served as the same static `index.html`. Previews that
show the entry's title, a summary and its tags make shared links useful.

## What Changes

- Public note pages (`/notes/:id/details`, `/notes/:id`) and public bookmark
  pages (`/bookmarks/:id` and its sub-paths) are served with link-preview
  tags for that entry: the page title, `og:title` and `twitter:title` are the
  entry's title; the description tags carry a plain-text summary of the
  content and the entry's tags; `og:url` is the page's canonical URL,
  `og:type` is `article` and the Twitter card is `summary_large_image`.
- The image stays the standard Codever image.
- Private, missing or invalid entries, and any failure, get the unchanged
  generic `index.html`, so no private title or content can leak.
- Share-link pages (`/notes/shared/:token`, `/bookmarks/shared/:token`) and
  all other pages keep the generic preview.
- The page that loads in the browser is unchanged; the Angular app starts as
  before.

## Capabilities

### New Capabilities

- `public-link-previews`: entry-specific link-preview tags for public note
  and bookmark pages.

### Modified Capabilities

None. Share links keep their generic preview, as today.

## Impact

- Apps: codever-api (new public route that serves the page HTML) and the
  production nginx config; codever-ui is unchanged apart from the built
  `index.html` being read by the API.
- Routes: public only. New `GET /api/public/link-previews/notes/:id` and
  `GET /api/public/link-previews/bookmarks/:id`, returning `text/html`.
  nginx sends public note and bookmark page URLs with a 24-character hex id
  to them and falls back to the static `index.html` when the API fails. No
  personal routes change.
- Mongoose models: none changed; reads public `Note` and `Bookmark` only.
- Deployment: the API container gets the built UI folder mounted read-only
  and a config entry with the path of `index.html`.
- Dependencies: none new (`cheerio` is already an API dependency).
