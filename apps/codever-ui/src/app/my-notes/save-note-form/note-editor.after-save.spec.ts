import { Subject, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { Note } from '../../core/model/note';
import { NoteEditorComponent } from './note-editor.component';

describe('NoteEditorComponent after saving an edit', () => {
  it('opens the details page in place of the editor, with the undo', () => {
    const navigate = vi.fn();
    const editor = Object.create(
      NoteEditorComponent.prototype
    ) as NoteEditorComponent;
    Object.assign(editor, {
      note: { _id: 'note-1', userId: 'owner' },
      noteBeforeEdit: { _id: 'note-1', title: 'Before edit' },
      personalNotesService: { updateNote: (note: Note) => of(note) },
      destroy$: new Subject<void>(),
      userDataStore: { updateUserDataHistory$: () => of({}) },
      protection: undefined,
      router: { navigate },
    });

    editor.updateNote({ title: 'Edited', content: 'c', tags: [] } as Note);

    expect(navigate).toHaveBeenCalledWith(
      ['./my-notes/note-1/details'],
      expect.objectContaining({
        replaceUrl: true,
        state: expect.objectContaining({
          undoLastSave: { _id: 'note-1', title: 'Before edit' },
        }),
      })
    );
  });
});
