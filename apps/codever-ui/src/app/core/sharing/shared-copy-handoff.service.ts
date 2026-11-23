import { Injectable } from '@angular/core';
import { ShareableResourceType } from '../model/share-link';

interface PendingCopy {
  type: ShareableResourceType;
  id: string;
  content: unknown;
}

/**
 * Hands an entry opened through a sharing link over to its copy page.
 *
 * The content is kept in memory only, never in the URL, `history.state` or
 * browser storage, so it is gone on reload and the sharing token never leaves
 * the shared page.
 */
@Injectable({ providedIn: 'root' })
export class SharedCopyHandoff {
  private pending: PendingCopy | null = null;

  put<T extends { _id?: string }>(type: ShareableResourceType, content: T): void {
    this.pending = { type, id: content._id, content };
  }

  /**
   * Returns the pending content once, only for the matching type and id.
   */
  take<T>(type: ShareableResourceType, id: string): T | undefined {
    const pending = this.pending;
    if (!pending || pending.type !== type || pending.id !== id) {
      return undefined;
    }
    this.pending = null;
    return pending.content as T;
  }
}
