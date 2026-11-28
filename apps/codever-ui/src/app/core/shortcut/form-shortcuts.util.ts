import { FormGroupDirective } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

/**
 * Ctrl/Cmd+Enter in an entry form: submits it like the Save button, but only
 * when Save is enabled. Never inserts a line break. Returns true when the
 * form was submitted.
 */
export function submitFormOnShortcut(
  event: Event,
  form: FormGroupDirective,
  canSubmit: boolean
): boolean {
  event.preventDefault();
  if (!canSubmit) {
    return false;
  }
  form.onSubmit(event);
  return true;
}

/**
 * Whether Escape should leave an edit form: not when another element (an
 * autocomplete panel, menu or dialog) already handled the key, and not while
 * a dialog is open.
 */
export function shouldLeaveFormOnEscape(
  event: KeyboardEvent,
  dialog: MatDialog
): boolean {
  return (
    !event.defaultPrevented && !event.repeat && dialog.openDialogs.length === 0
  );
}
