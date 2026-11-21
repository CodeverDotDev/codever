# browser-bookmarks-export Specification

## Purpose

Lets users export all of their bookmarks as a browser-importable bookmark
HTML file, organised in collection, tag and "all" folders, to migrate to
or back up into Chrome, Brave, Chromium and other browsers.

## Requirements

### Requirement: Export format choice on the bookmarks dashboard

The system SHALL let a logged-in user choose, when exporting from the
bookmarks dashboard, between the existing Codever JSON format and a
browser HTML format. The Codever JSON export SHALL remain unchanged. The
export dialog SHALL state that the browser HTML format is meant for
browsers and does not contain all Codever data (for example
descriptions), and that Codever JSON is the complete backup.

#### Scenario: JSON export unchanged

- **WHEN** the user exports with the Codever JSON format
- **THEN** the downloaded file is the same JSON bookmark list as before
  this change

#### Scenario: Browser HTML export

- **WHEN** the user exports with the browser HTML format
- **THEN** a `.html` file is downloaded that Chrome, Brave and Chromium
  accept through their "Import bookmarks from HTML file" function

#### Scenario: Dialog explains the difference

- **WHEN** the user opens the export dialog
- **THEN** the dialog states that browser HTML is for importing into a
  browser and that Codever JSON is the complete backup

### Requirement: All bookmarks are exported

The browser HTML export SHALL include every bookmark of the user, both
private and public, with no visibility filter and no separate folders by
visibility.

#### Scenario: Private and public bookmarks included

- **WHEN** a user with 3 private and 2 public bookmarks exports as
  browser HTML
- **THEN** the `All` folder contains all 5 bookmarks
- **AND** the file has no folder that separates private from public
  bookmarks

#### Scenario: User without bookmarks

- **WHEN** a user with no bookmarks requests a browser HTML export
- **THEN** no file is produced and the user is told there are no
  bookmarks to export

### Requirement: Folder structure of the export

The browser HTML export SHALL contain a single root folder named
`Codever export <YYYY-MM-DD>` (the export date). Inside it, in this order,
the file SHALL contain a `Collections` folder, a `Tags` folder and an
`All` folder. The `All` folder SHALL contain every exported bookmark
exactly once, newest first. A folder that would be empty SHALL be
omitted, except `All`.

#### Scenario: Root folder name

- **WHEN** a user exports as browser HTML on 2026-11-20
- **THEN** all content is inside one root folder named
  `Codever export 2026-11-20`

#### Scenario: All folder holds each bookmark once

- **WHEN** a bookmark has 4 tags and belongs to 2 collections
- **THEN** it appears exactly once in `All`

#### Scenario: No collections

- **WHEN** the user has no collection containing a bookmark
- **THEN** the export has no `Collections` folder

### Requirement: Collection folders

The `Collections` folder SHALL contain one subfolder per collection of
the user that contains at least one bookmark, named after the collection
and sorted by name. Each collection folder SHALL contain the bookmarks of
that collection. Notes in a collection SHALL NOT be exported. A bookmark
in several collections SHALL appear in each of those collection folders.

#### Scenario: Collection with bookmarks and notes

- **WHEN** a collection "Reading list" holds 2 bookmarks and 1 note
- **THEN** `Collections/Reading list` contains the 2 bookmarks and no
  entry for the note

#### Scenario: Collection with only notes

- **WHEN** a collection contains only notes
- **THEN** no folder is created for it

#### Scenario: Bookmark in two collections

- **WHEN** a bookmark belongs to collections "A" and "B"
- **THEN** it appears in both `Collections/A` and `Collections/B`

### Requirement: Tag folders limited to the top N tags

The `Tags` folder SHALL contain one subfolder per tag for the N tags used
by the most exported bookmarks, sorted by tag name. Ties at the cut-off
SHALL be broken by tag name in ascending order. Each tag folder SHALL
contain every exported bookmark carrying that tag, so a bookmark with
several selected tags appears in several tag folders. N SHALL default to
50, SHALL be adjustable by the user in the export dialog, and the dialog
SHALL offer an option to create folders for all tags. Bookmarks whose
tags are all outside the top N SHALL still be present in `All`.

#### Scenario: Default cap

- **WHEN** a user with 120 distinct tags exports without changing N
- **THEN** `Tags` contains 50 folders for the 50 most used tags

#### Scenario: All tags option

- **WHEN** the user chooses folders for all tags
- **THEN** `Tags` contains one folder per distinct tag

#### Scenario: Bookmark appears under each selected tag

- **WHEN** a bookmark is tagged `java` and `spring` and both are within
  the top N
- **THEN** it appears in `Tags/java` and in `Tags/spring`

#### Scenario: Bookmark with only rare tags

- **WHEN** a bookmark's only tag is outside the top N
- **THEN** it appears in no tag folder and is present in `All`

### Requirement: Link attributes

Each exported link SHALL carry the bookmark name as text, its location as
`HREF`, its creation time as `ADD_DATE` and its last update time as
`LAST_MODIFIED` (both in seconds since the Unix epoch), and all of its
tags as a comma-separated `TAGS` attribute regardless of the tag folder
cap. Descriptions SHALL NOT be exported.

#### Scenario: Tags attribute holds every tag

- **WHEN** a bookmark tagged `java`, `spring` and `rare-tag` is exported
  and `rare-tag` is outside the top N
- **THEN** each of its links has `TAGS="java,spring,rare-tag"`

#### Scenario: No description

- **WHEN** a bookmark with a description is exported
- **THEN** the description does not appear in the file

### Requirement: Safe file content

The export SHALL escape bookmark names, locations, tags and collection
names so that they cannot alter the HTML structure of the file. Bookmarks
whose location uses the `javascript:` or `data:` scheme SHALL be left out
of the export, and the user SHALL be told how many were left out.

#### Scenario: Name with markup characters

- **WHEN** a bookmark is named `<b>Tips & "tricks"</b>`
- **THEN** the browser shows that exact text as the bookmark name and no
  extra elements appear in the file

#### Scenario: Script URL skipped

- **WHEN** one bookmark has the location `javascript:alert(1)`
- **THEN** that bookmark is not in the file
- **AND** the user is told that 1 bookmark was left out
