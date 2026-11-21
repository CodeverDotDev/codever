## ADDED Requirements

### Requirement: Import format choice in the dialog

The import dialog on the bookmarks dashboard SHALL let the user choose
between "Browser HTML" (default) and "Codever JSON" before picking a
file. The file picker SHALL offer `.html` files for Browser HTML and
`.json` files for Codever JSON. For Codever JSON the dialog SHALL offer
a "Keep public visibility from the file" checkbox, unchecked by default,
and SHALL explain that existing bookmarks with the same URL are kept
and that dates are restored. A selected Codever JSON file that is not
valid JSON or does not contain an array of bookmarks SHALL show an error
in the dialog and SHALL NOT be sent. After an import the dialog SHALL
show the created, duplicate and invalid counts (and, for Codever JSON,
the made-private count).

#### Scenario: Browser HTML stays the default

- **WHEN** the user opens the import dialog
- **THEN** Browser HTML is selected and the file picker offers HTML
  files

#### Scenario: Restore a Codever JSON export

- **WHEN** the user selects Codever JSON and picks a file from the
  Codever JSON export
- **THEN** the bookmarks are restored as described by the
  `codever-json-bookmarks-import` capability
- **AND** the dialog reports the counts from the response

#### Scenario: Wrong file for JSON

- **WHEN** the user selects Codever JSON and picks a file that is not
  valid JSON
- **THEN** the dialog shows an error and nothing is uploaded

### Requirement: Closing the import dialog without importing

Closing the import dialog without importing SHALL leave the bookmarks
dashboard working and unchanged, with no error.

#### Scenario: Dialog dismissed

- **WHEN** the user opens the import dialog and closes it without
  choosing a file
- **THEN** no error occurs and the dashboard lists stay as they were
