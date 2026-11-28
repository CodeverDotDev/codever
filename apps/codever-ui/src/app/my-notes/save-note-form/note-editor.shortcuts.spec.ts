import { FormGroupDirective } from '@angular/forms';
import { describe, expect, it, vi } from 'vitest';
import { NoteEditorComponent } from './note-editor.component';

/** Ctrl/Cmd+Enter saves the note form; Escape leaves the edit form. */
const editorFor = (options: {
  isEditMode?: boolean;
  valid?: boolean;
  openDialogs?: number;
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private members of a large form component, set up without its constructor dependencies
  const editor: any = Object.create(NoteEditorComponent.prototype);
  Object.assign(editor, {
    isEditMode: options.isEditMode ?? true,
    noteForm: { valid: options.valid ?? true },
    deleteDialog: { openDialogs: new Array(options.openDialogs ?? 0) },
  });
  editor.cancelUpdate = vi.fn();
  const form = { onSubmit: vi.fn() } as unknown as FormGroupDirective & {
    onSubmit: ReturnType<typeof vi.fn>;
  };
  return { editor: editor as NoteEditorComponent, form };
};

const keydown = (init: KeyboardEventInit) =>
  new KeyboardEvent('keydown', { cancelable: true, ...init });

describe('NoteEditorComponent keyboard shortcuts', () => {
  it('saves a valid note with Ctrl/Cmd+Enter', () => {
    const { editor, form } = editorFor({});
    const event = keydown({ key: 'Enter', metaKey: true });

    editor.saveWithShortcut(event, form);

    expect(form.onSubmit).toHaveBeenCalledWith(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('does not save an invalid note', () => {
    const { editor, form } = editorFor({ valid: false });

    editor.saveWithShortcut(keydown({ key: 'Enter', ctrlKey: true }), form);

    expect(form.onSubmit).not.toHaveBeenCalled();
  });

  it('leaves the edit form with Escape, like Cancel', () => {
    const { editor } = editorFor({});

    editor.leaveWithEscape(keydown({ key: 'Escape' }));

    expect(editor.cancelUpdate).toHaveBeenCalled();
  });

  it('stays when a panel handled Escape or a dialog is open', () => {
    const handled = editorFor({});
    const event = keydown({ key: 'Escape' });
    event.preventDefault();
    handled.editor.leaveWithEscape(event);

    const withDialog = editorFor({ openDialogs: 1 });
    withDialog.editor.leaveWithEscape(keydown({ key: 'Escape' }));

    expect(handled.editor.cancelUpdate).not.toHaveBeenCalled();
    expect(withDialog.editor.cancelUpdate).not.toHaveBeenCalled();
  });

  it('does not leave the form for a new, cloned or copied note', () => {
    const { editor } = editorFor({ isEditMode: false });

    editor.leaveWithEscape(keydown({ key: 'Escape' }));

    expect(editor.cancelUpdate).not.toHaveBeenCalled();
  });
});
