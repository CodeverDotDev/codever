## Purpose

Let owners undo the save of their own note or bookmark once, right after
saving it in the editor, so content deleted by mistake can be brought back.

## ADDED Requirements

### Requirement: Details page after saving an edit

After the owner saves an edit of their note or bookmark in the editor, the UI
SHALL open the entry's details page, which shows the saved content. The
editor SHALL be replaced in the browser history, so going back returns to
the page where the edit started. An administrator's edit of another user's
bookmark SHALL keep opening the history list.

#### Scenario: Edit a bookmark from search results
- **WHEN** the owner edits a bookmark from the search results and saves
- **THEN** the bookmark's details page shows the saved bookmark
- **AND** going back shows the search results, not the editor

#### Scenario: Admin edit
- **WHEN** an administrator saves an edit of another user's bookmark
- **THEN** the history list opens and no undo is offered

### Requirement: Undo the last save once

The details page opened after an edit SHALL offer "Undo last save" in the
entry's card footer. Undo SHALL ask for confirmation, explaining that the
changes of the last save will be discarded. After confirmation it SHALL write
the entry as it was loaded into the editor back through the normal update,
so the same validation applies, and SHALL then show that content and no
longer offer the undo. The content written back SHALL clear fields the save
filled in. There SHALL be no redo. A failed undo SHALL show an error message,
including the existing message when another user already has a public
bookmark with the same URL, and SHALL leave the page and the offer unchanged.

#### Scenario: Undo a note edit
- **WHEN** the owner removes a paragraph from a note, saves, chooses "Undo
  last save" on the details page and confirms
- **THEN** the note has the paragraph again
- **AND** the undo is no longer offered

#### Scenario: Cancel the confirmation
- **WHEN** the owner chooses "Undo last save" and cancels
- **THEN** nothing changes and the undo is still offered

#### Scenario: Field added by the save
- **WHEN** the owner adds a reference to a note that had none, saves and
  undoes the save
- **THEN** the note has no reference again

### Requirement: The undo ends when the owner leaves

The undo SHALL be offered only on the details page opened directly by the
save. Leaving that page, reloading it, or coming back to it through the
browser history SHALL remove the offer. Details pages opened in any other
way, lists, search results, public pages and sharing-link pages SHALL NOT
offer it. Nothing about the earlier version SHALL be stored on the server.

#### Scenario: Leave and come back
- **WHEN** the owner saves a bookmark, goes back to the search results and
  opens the bookmark's details page again
- **THEN** no undo is offered

#### Scenario: Reload
- **WHEN** the owner reloads the details page after a save
- **THEN** no undo is offered
