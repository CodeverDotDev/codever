import { Injectable } from '@angular/core';
import { Bookmark } from '../model/bookmark';
import { AddToHistoryService } from '../user/add-to-history.service';

/**
 * Priorities for `k+k` context providers. Only the highest-priority registered
 * provider is consulted when the sequence fires, so a modal dialog wins over a
 * page, and a bookmark details page wins over lower-priority page contexts.
 * The side Pinned panel and collection surfaces are intentionally NOT `k+k`
 * providers - they respond to `Enter` only while their filter has focus.
 */
export const MAIN_LINK_SHORTCUT_PRIORITY = {
  DIALOG: 30,
  DETAILS: 20,
  SEARCH: 10,
} as const;

/**
 * A surface that can resolve the single visible bookmark for the `k+k`
 * sequence. Register on activation (dialog open / page init) and unregister on
 * teardown so only currently active surfaces participate.
 */
export interface BookmarkShortcutContext {
  /** Higher wins. See {@link MAIN_LINK_SHORTCUT_PRIORITY}. */
  priority: number;
  /** The single visible bookmark, or null when not exactly one bookmark. */
  getSingleVisibleBookmark(): Bookmark | null;
  /** Logged-in state used to decide history promotion. Defaults to false. */
  isUserLoggedIn?(): boolean;
}

/**
 * Coordinates the "open the only visible bookmark" keyboard shortcuts.
 *
 * - `k+k` (handled globally): opens the single visible bookmark of the active
 *   non-editable context (dialog, bookmark details, or search results).
 * - `Enter` (handled by each focused filter component): components call
 *   {@link openBookmarkInNewTab} directly.
 *
 * The second `k` must arrive within {@link SEQUENCE_TIMEOUT_MS}; auto-repeat is
 * ignored, any non-`k` key resets the sequence, and the sequence never fires
 * while an editable control has focus.
 */
@Injectable({ providedIn: 'root' })
export class MainLinkShortcutService {
  static readonly SEQUENCE_TIMEOUT_MS = 400;

  private contexts: BookmarkShortcutContext[] = [];
  private lastKPressTime = 0;

  constructor(private addToHistoryService: AddToHistoryService) {}

  register(context: BookmarkShortcutContext): void {
    this.contexts.push(context);
  }

  unregister(context: BookmarkShortcutContext): void {
    this.contexts = this.contexts.filter((c) => c !== context);
  }

  /**
   * Process a global keydown for the `k+k` sequence. Returns true when a
   * bookmark was opened (and the event's default was prevented).
   */
  handleKeydown(event: KeyboardEvent): boolean {
    if (event.repeat) {
      return false;
    }

    const key = event.key;

    // Standalone modifier presses neither advance nor reset the sequence.
    if (
      key === 'Shift' ||
      key === 'Control' ||
      key === 'Alt' ||
      key === 'Meta'
    ) {
      return false;
    }

    const isPlainK =
      (key === 'k' || key === 'K') &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey;

    if (!isPlainK) {
      this.resetSequence();
      return false;
    }

    // Never hijack typing; focused filters use Enter instead.
    if (this.isEditableTarget(event.target)) {
      this.resetSequence();
      return false;
    }

    const now = this.now();
    if (
      this.lastKPressTime &&
      now - this.lastKPressTime <= MainLinkShortcutService.SEQUENCE_TIMEOUT_MS
    ) {
      this.resetSequence();
      const resolved = this.resolveActiveContextBookmark();
      if (resolved) {
        event.preventDefault();
        this.openBookmarkInNewTab(resolved.bookmark, resolved.userIsLoggedIn);
        return true;
      }
      return false;
    }

    this.lastKPressTime = now;
    return false;
  }

  /**
   * Resolve the single visible bookmark of the highest-priority active context.
   * Only the top context is consulted, matching modal/active-context semantics.
   */
  resolveActiveContextBookmark(): {
    bookmark: Bookmark;
    userIsLoggedIn: boolean;
  } | null {
    if (this.contexts.length === 0) {
      return null;
    }
    const active = [...this.contexts].sort(
      (a, b) => b.priority - a.priority
    )[0];
    const bookmark = active.getSingleVisibleBookmark();
    if (!bookmark) {
      return null;
    }
    return {
      bookmark,
      userIsLoggedIn: active.isUserLoggedIn ? active.isUserLoggedIn() : false,
    };
  }

  /**
   * Open a bookmark's main link in a new tab, promoting it in history when the
   * user is logged in. Shared by `k+k` and the per-filter `Enter` handlers so
   * history promotion stays consistent with the existing bookmark-link behavior.
   */
  openBookmarkInNewTab(bookmark: Bookmark, userIsLoggedIn: boolean): void {
    if (!bookmark || !bookmark.location) {
      return;
    }
    this.addToHistoryService.promoteInHistoryIfLoggedIn(
      userIsLoggedIn,
      bookmark
    );
    window.open(bookmark.location, '_blank');
  }

  private resetSequence(): void {
    this.lastKPressTime = 0;
  }

  private now(): number {
    return Date.now();
  }

  private isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    const tag = target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      return true;
    }
    return target.isContentEditable;
  }
}
