import { FormGroupDirective } from '@angular/forms';
import { describe, expect, it, vi } from 'vitest';
import { SaveBookmarkFormComponent } from './save-bookmark-form.component';

/** Ctrl/Cmd+Enter saves the bookmark form; Escape leaves the edit form. */
const editorFor = (options: {
  isUpdate?: boolean;
  valid?: boolean;
  personalBookmarkPresent?: boolean;
  openDialogs?: number;
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private members of a large form component, set up without its constructor dependencies
  const editor: any = Object.create(SaveBookmarkFormComponent.prototype);
  Object.assign(editor, {
    isUpdate: options.isUpdate ?? true,
    bookmarkForm: { valid: options.valid ?? true },
    personalBookmarkPresent: options.personalBookmarkPresent ?? false,
    publicBookmarkPresentDialog: {
      openDialogs: new Array(options.openDialogs ?? 0),
    },
  });
  editor.cancelUpdate = vi.fn();
  const form = { onSubmit: vi.fn() } as unknown as FormGroupDirective & {
    onSubmit: ReturnType<typeof vi.fn>;
  };
  return { editor: editor as SaveBookmarkFormComponent, form };
};

const keydown = (init: KeyboardEventInit) =>
  new KeyboardEvent('keydown', { cancelable: true, ...init });

describe('SaveBookmarkFormComponent keyboard shortcuts', () => {
  it('saves a valid bookmark with Ctrl/Cmd+Enter', () => {
    const { editor, form } = editorFor({});
    const event = keydown({ key: 'Enter', ctrlKey: true });

    editor.saveWithShortcut(event, form);

    expect(form.onSubmit).toHaveBeenCalledWith(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it.each([
    ['an invalid form', { valid: false }],
    ['an existing personal bookmark', { personalBookmarkPresent: true }],
  ])('does not save %s, like the disabled Save button', (_label, options) => {
    const { editor, form } = editorFor(options);

    editor.saveWithShortcut(keydown({ key: 'Enter', metaKey: true }), form);

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

  it('does not leave the form for a new, cloned or copied bookmark', () => {
    const { editor } = editorFor({ isUpdate: false });

    editor.leaveWithEscape(keydown({ key: 'Escape' }));

    expect(editor.cancelUpdate).not.toHaveBeenCalled();
  });
});
