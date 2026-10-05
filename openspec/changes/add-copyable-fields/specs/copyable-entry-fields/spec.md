## Purpose

Give note and bookmark users a compact, searchable, and individually copyable place for reusable label/value information while keeping automatically supplied source context separate from user-edited fields.

## ADDED Requirements

### Requirement: Optional copyable fields on notes and bookmarks

Notes and bookmarks SHALL support zero or more ordered copyable fields. Each field SHALL contain a non-empty label and a non-empty single-line value. Labels SHALL be limited to 100 characters and values SHALL be limited to 1,000 characters. Duplicate labels SHALL be allowed, and the order supplied by the user SHALL be preserved.

#### Scenario: Save valid copyable fields
- **WHEN** an authenticated user creates or updates a note or bookmark with no more than ten fields whose labels and values satisfy the limits
- **THEN** the personal save succeeds
- **AND** the saved entry returns the fields in the submitted order
- **AND** duplicate labels are retained

#### Scenario: Save without copyable fields
- **WHEN** an authenticated user creates or updates a note or bookmark without copyable fields
- **THEN** the save succeeds when all other entry validation succeeds
- **AND** the response contains no populated copyable-field section

#### Scenario: Reject invalid copyable fields
- **WHEN** a personal create or update request contains more than ten fields, a missing or blank label, a missing or blank value, a label longer than 100 characters, a value longer than 1,000 characters, or a value containing a line break
- **THEN** the request is rejected with `ValidationError` and HTTP 400
- **AND** no partial copyable-field data is persisted

### Requirement: Edit and preserve copyable fields

The web UI SHALL provide an optional Copyable fields section for note and bookmark creation and editing. It SHALL allow users to add, edit, reorder, and remove fields, and SHALL require both inputs before saving a field. The section SHALL explain: "Add optional label/value pairs for information you want to copy quickly."

#### Scenario: Add and remove fields in the editor
- **WHEN** a user adds a field, enters a label and single-line value, changes its position, and removes another field before saving
- **THEN** the saved entry contains only the remaining fields in their final order

#### Scenario: Incomplete editor row
- **WHEN** a user attempts to save a note or bookmark with a copyable-field row missing its label or value
- **THEN** the UI identifies the incomplete row and prevents the save

### Requirement: Display and copy values

The web UI SHALL display populated Copyable fields after the main note content or bookmark description and before tags on both list cards and details pages. Each field SHALL provide a copy action that copies the value without the label. Empty sections SHALL not be rendered.

#### Scenario: Copy a field value
- **WHEN** a user activates the copy action for a populated field
- **THEN** only that field's value is placed on the clipboard
- **AND** the label is not included in the copied text

#### Scenario: Public entry fields
- **WHEN** a note or bookmark is public and contains copyable fields
- **THEN** the fields are visible to anyone who can view the public entry
- **AND** the copy action remains available

### Requirement: Clone and copy-to-mine preserve fields

Cloning an entry or copying a public entry to the current user's collection SHALL preserve its copyable fields and their order. The copied fields SHALL remain editable by the new owner.

#### Scenario: Copy a public entry to mine
- **WHEN** an authenticated user copies a public note or bookmark containing copyable fields to their own collection
- **THEN** the new entry contains the same fields in the same order
- **AND** the new owner can edit or remove those fields independently of the original

### Requirement: Search copyable fields with low relevance

Note and bookmark search SHALL consider both copyable-field labels and values. Matches in copyable fields SHALL contribute less relevance than matches in the entry's primary title/name, content/description, tags, or location/reference fields, while still allowing an entry to be returned when the query matches only a copyable field.

#### Scenario: Search finds a copyable value
- **WHEN** a user searches for text that occurs only in a note or bookmark copyable field
- **THEN** the matching entry is returned
- **AND** the field remains visible when the result is expanded

#### Scenario: Primary content outranks a copyable match
- **WHEN** one result matches the query in primary entry content and another result matches only in a copyable field
- **THEN** the primary-content match is ranked ahead of the copyable-field-only match, all other ranking factors being equal

### Requirement: Read-only source context

When a note contains available structured source metadata, the web UI SHALL display a separate read-only Source context section. The section SHALL display the file name and project when available, SHALL omit absent values, and SHALL not treat source context as editable Copyable fields. Source context values SHALL be copyable individually by copying the value only.

#### Scenario: Display source context
- **WHEN** a note has source metadata containing a file path and project
- **THEN** the UI displays the file name and project in Source context
- **AND** the full local path and workspace are not displayed by default
- **AND** neither displayed value appears as an editable copyable-field row

#### Scenario: No source context
- **WHEN** a note has no file or project source metadata
- **THEN** the Source context section is not rendered

### Requirement: Single-result lists start expanded

Any note or bookmark list SHALL start its sole visible entry expanded when the current list contains exactly one entry. Lists containing multiple entries SHALL retain collapsed-by-default behavior for content that exceeds the existing preview threshold. The existing show-more/show-less control SHALL remain available.

#### Scenario: One-entry list
- **WHEN** a search, personal, public, tag-filtered, or other note/bookmark list contains exactly one visible entry
- **THEN** that entry starts expanded
- **AND** its Source context and Copyable fields are visible when populated
- **AND** the user can still collapse the entry using the existing toggle

#### Scenario: Multiple-entry list
- **WHEN** a note or bookmark list contains more than one visible entry
- **THEN** entries retain the existing collapsed-by-default behavior for content exceeding the preview threshold

#### Scenario: Details page
- **WHEN** a user opens a note or bookmark details page
- **THEN** the entry remains expanded according to existing details-page behavior regardless of list result count

