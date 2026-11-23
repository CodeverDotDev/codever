import { Injectable } from '@angular/core';
import { ShareableResourceType } from '../model/share-link';

export const SHARED_LOGIN_RETURN_KEY = 'codever.sharedLoginReturn';
export const SHARED_LOGIN_RETURN_MAX_AGE_MS = 30 * 60 * 1000;

const SHARED_PAGE_PATTERN = /^\/(notes|bookmarks)\/shared\/([^/?#]+)\/?(?:[?#].*)?$/;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{1,512}$/;

export interface SharedLoginReturnEntry {
  type: ShareableResourceType;
  token: string;
  copy: boolean;
}

interface StoredEntry extends SharedLoginReturnEntry {
  savedAt: number;
}

/**
 * Keeps the sharing token of a shared page in the tab's session storage while
 * the visitor logs in, so the return address sent to Keycloak can stay
 * token-free. The entry is removed on every read.
 */
@Injectable({ providedIn: 'root' })
export class SharedLoginReturn {
  isSharedPage(url: string): boolean {
    return SHARED_PAGE_PATTERN.test(url ?? '');
  }

  /**
   * Stores the token of the shared page at `url`. Returns false (and stores
   * nothing) for any other page.
   */
  remember(url: string, copy: boolean, now = Date.now()): boolean {
    const match = SHARED_PAGE_PATTERN.exec(url ?? '');
    if (!match) {
      return false;
    }
    const entry: StoredEntry = {
      type: match[1] === 'notes' ? 'note' : 'bookmark',
      token: decodeURIComponent(match[2]),
      copy,
      savedAt: now,
    };
    try {
      sessionStorage.setItem(SHARED_LOGIN_RETURN_KEY, JSON.stringify(entry));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reads and removes the stored entry. Returns nothing for a missing,
   * malformed or expired entry.
   */
  takeOnce(now = Date.now()): SharedLoginReturnEntry | undefined {
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(SHARED_LOGIN_RETURN_KEY);
      sessionStorage.removeItem(SHARED_LOGIN_RETURN_KEY);
    } catch {
      return undefined;
    }
    if (!raw) {
      return undefined;
    }

    let entry: Partial<StoredEntry>;
    try {
      entry = JSON.parse(raw);
    } catch {
      return undefined;
    }
    const valid =
      entry &&
      (entry.type === 'note' || entry.type === 'bookmark') &&
      typeof entry.token === 'string' &&
      TOKEN_PATTERN.test(entry.token) &&
      typeof entry.copy === 'boolean' &&
      typeof entry.savedAt === 'number' &&
      now - entry.savedAt >= 0 &&
      now - entry.savedAt <= SHARED_LOGIN_RETURN_MAX_AGE_MS;
    if (!valid) {
      return undefined;
    }
    return { type: entry.type, token: entry.token, copy: entry.copy };
  }

  /** The app path of the shared page for an entry. */
  sharedPagePath(entry: SharedLoginReturnEntry): string {
    const segment = entry.type === 'note' ? 'notes' : 'bookmarks';
    return `/${segment}/shared/${encodeURIComponent(entry.token)}`;
  }
}
