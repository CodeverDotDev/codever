# public-link-previews Specification

## Purpose

Show the title, a summary and the tags of a public note or bookmark when a
link to its page is shared on another platform, instead of the generic
Codever preview.

## Requirements

### Requirement: Link-preview tags for public note and bookmark pages

A request for the page of a public note (`/notes/:id/details` or
`/notes/:id`) or of a public bookmark (`/bookmarks/:id`, with or without a
trailing path) SHALL return the app's HTML page with HTTP 200 and
`Content-Type: text/html`, in which:

- the document title, `og:title` and `twitter:title` are the note title or
  the bookmark name;
- `description`, `og:description` and `twitter:description` are a plain-text
  summary of the note content or the bookmark description, at most 200
  characters and cut at a word boundary with "…", followed by the entry's
  tags as `#tag` separated by spaces; when the entry has no text, only the
  tags; when it has neither, the generic Codever description;
- for a bookmark without a description, the summary is the host of its URL;
- `og:url` is the page's canonical URL (`/notes/:id/details` or
  `/bookmarks/:id` on the public site), `og:type` is `article` and
  `twitter:card` is `summary_large_image`;
- `og:image` and `twitter:image` are the standard Codever image.

Markdown, HTML and code formatting SHALL NOT appear in the summary, and all
values SHALL be HTML-escaped. The rest of the page SHALL be unchanged, so
the app loads in the browser as before.

#### Scenario: Shared public note
- **WHEN** a platform fetches `/notes/<id>/details` of a public note titled
  "Docker cleanup" with tags `docker` and `devops`
- **THEN** `og:title` is "Docker cleanup"
- **AND** `og:description` starts with the note's text without Markdown and
  ends with "#docker #devops"

#### Scenario: Shared public bookmark
- **WHEN** a platform fetches `/bookmarks/<id>` of a public bookmark without
  a description
- **THEN** `og:title` is the bookmark name and the summary is the host of its
  URL followed by its tags

#### Scenario: Title with HTML characters
- **WHEN** a public note's title contains `<script>` or quotes
- **THEN** the tags contain the escaped text and the page HTML is otherwise
  unchanged

### Requirement: Generic preview for everything else

Requests for a note or bookmark that is private, does not exist, or whose id
is not a valid id SHALL return the unchanged generic page with HTTP 200, the
same as today, and SHALL NOT reveal whether the entry exists or any of its
content. If the page cannot be produced (for example the app HTML is not
available or the database fails), the visitor SHALL still get the unchanged
generic page. Share-link pages (`/notes/shared/:token`,
`/bookmarks/shared/:token`) and all other pages SHALL keep the generic
preview.

#### Scenario: Private note
- **WHEN** a platform fetches the page of a private note
- **THEN** the response is the generic page with HTTP 200 and contains
  neither the note's title nor its content

#### Scenario: Share link
- **WHEN** a platform fetches `/notes/shared/<token>` of a shared note
- **THEN** the preview is the generic Codever preview

#### Scenario: API unavailable
- **WHEN** the page of a public note is requested while the API is down
- **THEN** the visitor gets the generic page and the app loads as usual

### Requirement: Up-to-date previews

The preview SHALL reflect the entry as currently stored at the time of the
request, so a platform that fetches the page again after an edit gets the
new title, summary and tags. A note or bookmark made private SHALL get the
generic preview from then on.

#### Scenario: Note made private
- **WHEN** the owner makes a public note private and a platform fetches its
  page again
- **THEN** the generic preview is returned
