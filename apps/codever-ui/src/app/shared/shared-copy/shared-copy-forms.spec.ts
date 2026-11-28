import { describe, expect, it, vi } from 'vitest';
import { SimpleChange } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { EMPTY, of, Subject } from 'rxjs';

import { NoteEditorComponent } from '../../my-notes/save-note-form/note-editor.component';
import { SaveBookmarkFormComponent } from '../../my-bookmarks/save-bookmark-form/save-bookmark-form.component';
import { SharedBookmark, SharedNote } from '../../core/model/share-link';
import { Note } from '../../core/model/note';

/**
 * Copying an entry opened through a sharing link: the shared payload has no
 * owner or visibility fields, and the copy must belong to the logged-in user,
 * be private, keep copyable fields in order and not reuse the original id.
 */
const fields = [
  { label: 'First', value: 'one' },
  { label: 'Second', value: 'two' },
];

const noteCopyEditor = (note: SharedNote) => {
  const createNote = vi.fn().mockReturnValue(EMPTY);
  const editor = Object.create(
    NoteEditorComponent.prototype
  ) as NoteEditorComponent;
  Object.assign(editor, {
    formBuilder: new UntypedFormBuilder(),
    maxNumberOfCharacters: 100000,
    tagsControl: new UntypedFormBuilder().control(''),
    note,
    isEditMode: false,
    cloneNote: true,
    copyToMine: true,
    userId: 'me',
    personalNotesService: { createNote },
    destroy$: new Subject<void>(),
  });
  editor.buildForm();
  editor.ngOnChanges({ note: new SimpleChange(null, note, true) });
  return { editor, createNote };
};

describe('Copy to mine from a sharing link', () => {
  it('keeps the original title (no CLONE prefix) for a copy', () => {
    const { editor } = noteCopyEditor({
      _id: 'n1',
      type: 'note',
      title: 'Shared note',
      content: 'c',
      tags: ['shared'],
    });

    expect(editor.noteForm.value.title).toBe('Shared note');
  });

  it('still prefixes the title of a plain clone', () => {
    const note: Note = {
      _id: 'n1',
      type: 'note',
      title: 'Mine',
      content: 'c',
      tags: ['mine'],
    };
    const editor = Object.create(
      NoteEditorComponent.prototype
    ) as NoteEditorComponent;
    Object.assign(editor, {
      formBuilder: new UntypedFormBuilder(),
      maxNumberOfCharacters: 100000,
      tagsControl: new UntypedFormBuilder().control(''),
      note,
      cloneNote: true,
      copyToMine: false,
    });
    editor.buildForm();
    editor.ngOnChanges({ note: new SimpleChange(null, note, true) });

    expect(editor.noteForm.value.title).toBe('CLONE - Mine');
  });

  it('saves a shared markdown note as a private note of the current user', () => {
    const shared: SharedNote = {
      _id: 'original-id',
      type: 'note',
      title: 'Shared note',
      content: 'Shared content',
      contentType: 'markdown',
      tags: ['shared'],
      copyableFields: fields,
    };
    const { editor, createNote } = noteCopyEditor(shared);

    editor.saveNote(editor.noteForm.value);

    const [userId, saved] = createNote.mock.lastCall as [string, Note];
    expect(userId).toBe('me');
    expect(saved.userId).toBe('me');
    expect(saved.public).toBe(false);
    expect(saved._id).toBeUndefined();
    expect(saved.title).toBe('Shared note');
    expect(saved.content).toBe('Shared content');
    expect(saved.copyableFields).toEqual(fields);
    expect(shared._id).toBe('original-id');
  });

  it('keeps the notebook source of a shared notebook note', () => {
    const notebook = JSON.stringify({ cells: [], nbformat: 4 });
    const { editor, createNote } = noteCopyEditor({
      _id: 'original-id',
      type: 'note',
      title: 'Notebook',
      // searchable text extracted from the cells when the notebook was saved
      content: 'print("hello")',
      contentType: 'notebook',
      notebookContent: notebook,
      tags: ['jupyter'],
    });

    editor.saveNote(editor.noteForm.value);

    const saved = createNote.mock.lastCall?.[1] as Note;
    expect(saved.contentType).toBe('notebook');
    expect(saved.notebookContent).toBe(notebook);
  });

  it('saves a shared bookmark as a private bookmark of the current user', () => {
    const shared: SharedBookmark = {
      _id: 'original-id',
      type: 'bookmark',
      name: 'Shared bookmark',
      location: 'https://example.com/shared',
      description: 'Shared description',
      tags: ['shared'],
      copyableFields: fields,
    };
    const createBookmark = vi.fn().mockReturnValue(EMPTY);
    // private members are set directly, as in copyable-fields.spec.ts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editor: any = Object.create(SaveBookmarkFormComponent.prototype);
    Object.assign(editor, {
      formBuilder: new UntypedFormBuilder(),
      tagsControl: new UntypedFormBuilder().control(''),
      userId: 'me',
      userData: { profile: { displayName: 'Me' } },
      markdownService: { toHtml: () => '<p>Shared description</p>' },
      personalBookmarksService: { createBookmark },
      datePipe: { transform: () => null },
      featureToggleService: { isAiNoteRefineEnabled: () => of(false) },
      route: { snapshot: { queryParams: {} } },
      bookmark$: of(shared),
      copyToMine: true,
      isUpdate: false,
      cloneBookmark: false,
    });
    const verifyExistence = vi
      .spyOn(editor, 'verifyExistenceInPersonalBookmarks')
      .mockImplementation(() => undefined);
    vi.spyOn(editor, 'startProtection').mockImplementation(() => undefined);

    editor.ngOnInit();
    editor.saveBookmark(editor.bookmarkForm.value);

    expect(verifyExistence).toHaveBeenCalledWith('https://example.com/shared');
    const [userId, saved] = createBookmark.mock.lastCall;
    expect(userId).toBe('me');
    expect(saved.userId).toBe('me');
    expect(saved.public).toBe(false);
    expect(saved._id).toBeFalsy();
    expect(saved.location).toBe('https://example.com/shared');
    expect(saved.copyableFields).toEqual(fields);
    expect(shared._id).toBe('original-id');
  });
});
