import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthoringProtection } from './authoring-protection';
import {
  DiscardDraftDialogComponent,
  DiscardDraftDialogData,
  DiscardDraftDialogResult,
} from '../../shared/dialog/discard-draft-dialog/discard-draft-dialog.component';

/**
 * Handles an editor's Cancel button. A changed new entry with an active draft
 * session asks "Discard this new …?"; confirming removes the visit's own draft
 * and disarms, so the following navigation is silent. Emits whether the editor
 * should leave. Other cases emit true and leave the unsaved-changes guard to
 * protect remaining changes (e.g. edits).
 */
export function confirmCancel(
  protection: AuthoringProtection | undefined,
  dialog: MatDialog,
  resourceName: string
): Observable<boolean> {
  if (!protection?.needsDiscardConfirmation()) {
    return of(true);
  }
  return dialog
    .open<
      DiscardDraftDialogComponent,
      DiscardDraftDialogData,
      DiscardDraftDialogResult
    >(DiscardDraftDialogComponent, {
      width: '420px',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      data: { resourceName },
    })
    .afterClosed()
    .pipe(
      map((result) => {
        // Escape or backdrop click means "Keep editing".
        if (result === 'discard') {
          protection.discard();
          return true;
        }
        return false;
      })
    );
}
