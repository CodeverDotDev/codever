import { Injectable } from '@angular/core';

/**
 * Phase 2 intermediate: migration is now complete for ALL users.
 * isSnippetsMigrated() always returns true.
 * Remove this service and all references to it in the final Phase 2 cleanup.
 */
@Injectable({
  providedIn: 'root',
})
export class SnippetsMigrationService {
  /** Migration is complete for all users — always returns true. */
  isSnippetsMigrated(_userId: string): boolean {
    return true;
  }
}

