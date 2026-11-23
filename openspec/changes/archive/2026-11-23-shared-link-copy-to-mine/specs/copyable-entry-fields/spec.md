## MODIFIED Requirements

### Requirement: Clone and copy-to-mine preserve fields

Cloning an entry or copying a public entry, or an entry opened through a
sharing link, to the current user's collection SHALL preserve its copyable
fields and their order. The copied fields SHALL remain editable by the new
owner.

#### Scenario: Copy a public entry to mine
- **WHEN** an authenticated user copies a public note or bookmark containing
  copyable fields to their own collection
- **THEN** the new entry contains the same fields in the same order
- **AND** the new owner can edit or remove those fields independently of the
  original

#### Scenario: Copy a shared entry to mine
- **WHEN** an authenticated user copies a note or bookmark opened through a
  sharing link and containing copyable fields to their own collection
- **THEN** the new entry contains the same fields in the same order
- **AND** the new owner can edit or remove those fields independently of the
  original
