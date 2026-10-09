## Purpose

Gives users a way to take an uploaded Jupyter notebook back out of Codever as the original `.ipynb` file, and keeps the personal notes export free of multi-megabyte raw notebook payloads while still listing notebook notes.

## ADDED Requirements

### Requirement: Download the original notebook file from note details

When viewing the details of a note whose content type is `notebook`, the system SHALL offer a download action that saves that note's stored original notebook JSON as a `.ipynb` file. The action SHALL be offered on note details only, and SHALL NOT be offered in note list or summary views.

#### Scenario: Notebook note details offer a download
- **WHEN** a user opens the details of a note whose content type is `notebook`
- **THEN** a notebook download action is presented alongside the note's other detail actions

#### Scenario: Downloaded file is the original notebook
- **WHEN** the user activates the notebook download action
- **THEN** the system saves a file named from the note title with an `.ipynb` extension, whose contents are the note's stored original notebook JSON, and whose media type is `application/x-ipynb+json`

#### Scenario: Markdown notes are unaffected
- **WHEN** a user opens the details of a note whose content type is `markdown`
- **THEN** no notebook download action is presented

#### Scenario: Notebook note without stored source
- **WHEN** a user opens the details of a notebook note that has no stored original notebook JSON
- **THEN** no notebook download action is presented and the note renders as it does today

#### Scenario: No download action in list or summary views
- **WHEN** a note whose content type is `notebook` is rendered in a list or summary context instead of note details
- **THEN** no notebook download action is presented

### Requirement: Notebook download respects existing note visibility

The notebook download action SHALL be available to exactly those users who can already view the note's details, and SHALL NOT introduce an additional authentication or authorization requirement.

#### Scenario: Owner downloads their own notebook
- **WHEN** an authenticated user opens the details of their own notebook note
- **THEN** the download action is available and produces the original notebook file

#### Scenario: Visitor downloads a public notebook
- **WHEN** a viewer who is not the owner opens the details of a public notebook note
- **THEN** the download action is available and produces the original notebook file

### Requirement: Personal notes export omits raw notebook content

The personal notes export SHALL return the authenticated user's notes, including notebook notes, but SHALL NOT include the raw notebook JSON for any returned note. Notebook notes SHALL remain identifiable as notebooks and SHALL retain the text extracted from their cells.

The export is requested by an authenticated user for their own user id and returns an array of that user's notes.

#### Scenario: Notebook notes are listed without their raw payload
- **WHEN** an authenticated user exports their personal notes and at least one of those notes is a notebook note
- **THEN** the export includes that note with content type `notebook` and its extracted text, and without the raw notebook JSON

#### Scenario: Markdown notes are unchanged
- **WHEN** an authenticated user exports their personal notes
- **THEN** notes with content type `markdown` are returned with the same fields as before

#### Scenario: Export requires the authenticated owner
- **WHEN** the personal notes export is requested without valid authentication, or for a user id other than the authenticated user
- **THEN** the request fails with HTTP 401 and no notes are returned

### Requirement: Export informs that notebooks are included without their source

When presenting the personal notes download, the system SHALL inform the user that Jupyter notebook notes are included without their raw `.ipynb` content.

#### Scenario: Notice shown with the notes download
- **WHEN** the user is offered the download of their exported notes
- **THEN** the user is told that Jupyter notebook notes are included without their raw `.ipynb` content
