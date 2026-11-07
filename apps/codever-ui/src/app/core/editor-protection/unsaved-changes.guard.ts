import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EditorProtectionRegistry } from './editor-protection.registry';
import {
  UnsavedChangesDialogComponent,
  UnsavedChangesDialogResult,
} from '../../shared/dialog/unsaved-changes-dialog/unsaved-changes-dialog.component';

/**
 * Asks before leaving an authoring route with changes that are neither saved
 * nor stored in a current create draft. Leaving never modifies stored drafts.
 */
export const unsavedChangesGuard: CanDeactivateFn<unknown> = ():
  | boolean
  | Observable<boolean> => {
  const registry = inject(EditorProtectionRegistry);
  const dialog = inject(MatDialog);

  // Write pending debounced changes first, so input typed within the last
  // second counts as draft-protected and does not prompt needlessly.
  registry.flushAll();
  if (!registry.hasUnprotectedChanges()) {
    return true;
  }

  return dialog
    .open<UnsavedChangesDialogComponent, unknown, UnsavedChangesDialogResult>(
      UnsavedChangesDialogComponent,
      { width: '420px', autoFocus: 'first-tabbable', restoreFocus: true }
    )
    .afterClosed()
    .pipe(
      map((result) => {
        // Closing the dialog via Escape or backdrop means "Stay".
        if (result === 'leave') {
          // Disarm, so teardown neither writes a draft nor arms beforeunload.
          registry.endAll();
          return true;
        }
        return false;
      })
    );
};
