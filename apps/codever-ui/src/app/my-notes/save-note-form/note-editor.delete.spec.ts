import { Subject, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { Note } from '../../core/model/note';
import { NoteEditorComponent } from './note-editor.component';

describe('NoteEditorComponent delete', () => {
  it('clears local note references after a successful delete', () => {
    const note: Note = {
      _id: 'note-1',
      type: 'note',
      title: 'Note',
      content: '',
      tags: [],
    };
    const removeNoteLocally = vi.fn();
    const navigate = vi.fn();
    const editor = Object.create(
      NoteEditorComponent.prototype
    ) as NoteEditorComponent;
    Object.assign(editor, {
      personalNotesService: { deleteNoteById: () => of({}) },
      destroy$: new Subject<void>(),
      userId: 'owner',
      userDataStore: { removeNoteLocally },
      protection: undefined,
      router: { navigate },
      deleteNotificationService: {
        showSuccessNotification: vi.fn(),
        showErrorNotification: vi.fn(),
      },
    });

    editor.deleteNote(note);

    expect(removeNoteLocally).toHaveBeenCalledWith(note);
    expect(navigate).toHaveBeenCalledWith(['']);
  });
});
