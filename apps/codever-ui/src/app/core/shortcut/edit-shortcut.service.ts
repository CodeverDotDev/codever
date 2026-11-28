import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { hasCommandModifier, isEditableTarget } from './keyboard-guard.util';

/**
 * A details page whose displayed entry can be edited with the `e` shortcut.
 * Register while the page is shown and unregister on teardown.
 */
export interface EditShortcutContext {
  /** Whether the page currently offers its Edit action to the user. */
  canEdit(): boolean;
  /** Runs the page's Edit action. */
  edit(): void;
}

/**
 * Handles the global `e` shortcut that opens the edit form of the entry shown
 * on a note or bookmark details page. Only the most recently registered
 * context is consulted. The key is ignored while typing, with Ctrl/Cmd/Alt,
 * on auto-repeat, when already handled, or while a dialog is open.
 */
@Injectable({ providedIn: 'root' })
export class EditShortcutService {
  private readonly dialog = inject(MatDialog);
  private contexts: EditShortcutContext[] = [];

  register(context: EditShortcutContext): void {
    this.contexts.push(context);
  }

  unregister(context: EditShortcutContext): void {
    this.contexts = this.contexts.filter((c) => c !== context);
  }

  /** Returns true when the edit action was triggered. */
  handleKeydown(event: KeyboardEvent): boolean {
    if (
      (event.key !== 'e' && event.key !== 'E') ||
      event.repeat ||
      event.defaultPrevented ||
      hasCommandModifier(event) ||
      isEditableTarget(event.target) ||
      this.dialog.openDialogs.length > 0
    ) {
      return false;
    }

    const context = this.contexts[this.contexts.length - 1];
    if (!context || !context.canEdit()) {
      return false;
    }

    event.preventDefault();
    context.edit();
    return true;
  }
}
