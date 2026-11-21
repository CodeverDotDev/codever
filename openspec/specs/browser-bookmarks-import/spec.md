# browser-bookmarks-import Specification

## Purpose

Lets users import a browser bookmark HTML file into their private Codever
bookmarks, turning folders into tags, and restores tags correctly when
the file is a Codever browser export, directly or via a browser.

## Requirements

### Requirement: Import access

The bookmark HTML import SHALL be available only to the authenticated
owner through `POST /api/personal/users/:userId/bookmarks/upload`.

#### Scenario: Unauthenticated request

- **WHEN** the upload endpoint is called without a valid token
- **THEN** the request is rejected with HTTP 401

#### Scenario: Token for another user

- **WHEN** the token's user differs from `:userId`
- **THEN** the request is rejected with HTTP 401
  (`UseridValidationError`)

### Requirement: Generic browser bookmark import

For a file without a Codever export root, the system SHALL create one
private bookmark per link, using the link text as name and its `HREF` as
location. Each ancestor folder name SHALL become a tag, lowercased with
whitespace replaced by dashes, except the browser root folders
`bookmarks`, `bookmarks-bar`, `favourites`, `bookmarks-menu` and
`bookmarks-toolbar`. Every imported bookmark SHALL also get the tag
`imported-browser`.

#### Scenario: Folder path becomes tags

- **WHEN** a link sits in `Bookmarks bar/Dev Tools/Java`
- **THEN** a private bookmark is created with tags `java`, `dev-tools`
  and `imported-browser`

### Requirement: Duplicates merge by location

The system SHALL treat links with the same location as one bookmark,
both within the uploaded file and against the user's existing bookmarks.
Tags from all occurrences SHALL be merged without duplicates into a
single bookmark. When merging into an existing public bookmark, the
`imported-browser` tag SHALL NOT be added. The response SHALL report the
number of bookmarks created, merged into existing bookmarks and failed,
counted per distinct location.

#### Scenario: Same URL in several folders of one file

- **WHEN** a file contains the same URL in `Tags/java` and `Tags/spring`
  of a Codever export and the user has no bookmark with that URL
- **THEN** exactly one bookmark is created, tagged `java`, `spring` and
  `imported-browser`
- **AND** the response reports 1 created and 0 duplicates

#### Scenario: URL already saved

- **WHEN** the file contains a URL the user already has as a private
  bookmark tagged `css`, inside folder `Design`
- **THEN** no new bookmark is created and the existing one is tagged
  `css`, `design` and `imported-browser`

#### Scenario: Existing public bookmark

- **WHEN** the file contains a URL the user already has as a public
  bookmark
- **THEN** the merged tags of that bookmark do not include
  `imported-browser`

### Requirement: Codever export root recognition

The system SHALL treat any folder whose name starts with
`Codever export` (case-insensitive), at any depth, as a Codever export
root. Links inside such a root SHALL get their tags only by the Codever
export rules; folders outside or inside the root SHALL otherwise not
become tags.

#### Scenario: Export imported via Chrome

- **WHEN** a file exported from Chrome contains
  `Other bookmarks/Imported/Codever export 2026-11-20/All/<link>`
- **THEN** the root is recognised and none of `other-bookmarks`,
  `imported`, `codever-export-2026-11-20` or `all` become tags

#### Scenario: Renamed root

- **WHEN** the user renamed the root folder to `My old stuff`
- **THEN** the file is imported with the generic browser import rules

### Requirement: Tags for links in a Codever export

For a link inside a Codever export root, the system SHALL take its tags
from the `TAGS` attribute when present and non-empty (comma-separated,
trimmed, empty values dropped). Otherwise, if the link is inside
`Tags/<tag>` (at any depth below that folder), the system SHALL use
`<tag>` as its tag. Folders below `Collections`, `All` or any other
folder of the root SHALL NOT become tags, and collections SHALL NOT be
created or changed. The tag `imported-browser` SHALL be added as for any
import, and imported bookmarks SHALL be private.

#### Scenario: Direct re-import with TAGS

- **WHEN** a link in `All` has `TAGS="java,spring,rare-tag"`
- **THEN** the bookmark gets tags `java`, `spring`, `rare-tag` and
  `imported-browser`

#### Scenario: Re-import after a browser dropped TAGS

- **WHEN** a link without `TAGS` is in `Tags/java` and the same URL is in
  `Tags/spring` and `All`
- **THEN** one bookmark is created with tags `java`, `spring` and
  `imported-browser`

#### Scenario: Collection folder ignored

- **WHEN** a link without `TAGS` is only in `Collections/Reading list`
- **THEN** the bookmark gets only the tag `imported-browser`
- **AND** no collection is created or modified

#### Scenario: Public bookmark comes back private

- **WHEN** a bookmark that was public in Codever is re-imported from an
  export into an account that does not have it
- **THEN** the created bookmark is private
