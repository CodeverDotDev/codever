import { Injectable } from '@angular/core';
import {
  BookmarkDraftForm,
  BookmarkDraftOptions,
  DRAFT_KEY_PREFIX,
  DRAFT_MAX_PER_TYPE,
  DRAFT_RETENTION_MS,
  DRAFT_SCHEMA_VERSION,
  DraftIdentity,
  DraftRecord,
  DraftResourceType,
  DraftSnapshot,
  draftKey,
  draftTypePrefix,
  draftUserPrefix,
  NoteDraftForm,
  NoteDraftOptions,
} from '../model/entry-draft';

export type DraftFailureReason = 'unavailable' | 'quota' | 'error';

export type DraftWriteResult =
  | { ok: true; record: DraftRecord }
  | { ok: false; reason: DraftFailureReason };

export type DraftRemoveResult =
  | { ok: true }
  | { ok: false; reason: DraftFailureReason };

export type DraftInvalidReason =
  | 'malformed'
  | 'unsupported-version'
  | 'incomplete';

export type DraftLoadResult =
  | { status: 'none' }
  | { status: 'found'; record: DraftRecord }
  | { status: 'invalid'; reason: DraftInvalidReason }
  | { status: 'unavailable' };

/** A stored draft: readable (`record`) or unreadable (`invalidReason`). */
export type DraftListEntry =
  | { identity: DraftIdentity; record: DraftRecord }
  | { identity: DraftIdentity; invalidReason: DraftInvalidReason };

export type DraftListResult =
  | { status: 'ok'; entries: DraftListEntry[] }
  | { status: 'unavailable' };

/**
 * Browser-local storage for new-entry drafts in `localStorage`. A user may
 * keep up to `DRAFT_MAX_PER_TYPE` drafts per type, each under its own key, so
 * tabs editing different drafts never overwrite each other. Drafts expire
 * after `DRAFT_RETENTION_MS` and are removed on logout. They are independent
 * of the personal-data `localStorage` setting and cache invalidation.
 */
@Injectable({ providedIn: 'root' })
export class DraftService {
  /**
   * Writes a versioned record for the identity, replacing an earlier version
   * of the same draft, then trims the user's drafts of that type to the cap.
   * Returns a failure result instead of throwing.
   */
  save(identity: DraftIdentity, snapshot: DraftSnapshot): DraftWriteResult {
    const record: DraftRecord = {
      schemaVersion: DRAFT_SCHEMA_VERSION,
      identity: { ...identity },
      savedAt: new Date().toISOString(),
      form: snapshot.form,
      options: snapshot.options,
    };
    try {
      const storage = this.storage();
      if (!storage) {
        return { ok: false, reason: 'unavailable' };
      }
      storage.setItem(draftKey(identity), JSON.stringify(record));
    } catch (error) {
      return { ok: false, reason: this.failureReason(error, 'save') };
    }
    // Trimming is best effort; the write itself already succeeded.
    this.list(identity.userId, identity.type);
    return { ok: true, record };
  }

  /**
   * Reads and validates one draft. Expired drafts are removed and reported
   * as `none`; `invalid` records are reported, not removed.
   */
  load(identity: DraftIdentity): DraftLoadResult {
    let raw: string | null;
    try {
      const storage = this.storage();
      if (!storage) {
        return { status: 'unavailable' };
      }
      raw = storage.getItem(draftKey(identity));
    } catch (error) {
      this.failureReason(error, 'load');
      return { status: 'unavailable' };
    }
    if (raw === null) {
      return { status: 'none' };
    }
    const result = this.parse(raw, identity);
    if (result.status === 'found' && this.isExpired(result.record, Date.now())) {
      this.remove(identity);
      return { status: 'none' };
    }
    return result;
  }

  /**
   * Lists the user's drafts of a type, newest first, with unreadable ones
   * last. Removes expired drafts and the oldest readable drafts beyond the
   * cap. Unreadable drafts are only removed by the user or on logout.
   */
  list(userId: string, type: DraftResourceType): DraftListResult {
    const prefix = draftTypePrefix(userId, type);
    const readable: { identity: DraftIdentity; record: DraftRecord }[] = [];
    const unreadable: DraftListEntry[] = [];
    try {
      const storage = this.storage();
      if (!storage) {
        return { status: 'unavailable' };
      }
      const now = Date.now();
      for (const key of this.keysWithPrefix(storage, prefix)) {
        const identity: DraftIdentity = {
          userId,
          type,
          id: decodeURIComponent(key.slice(prefix.length)),
        };
        const result = this.parse(storage.getItem(key) ?? '', identity);
        if (result.status === 'found') {
          if (this.isExpired(result.record, now)) {
            storage.removeItem(key);
          } else {
            readable.push({ identity, record: result.record });
          }
        } else if (result.status === 'invalid') {
          unreadable.push({ identity, invalidReason: result.reason });
        }
      }
      readable.sort((a, b) => b.record.savedAt.localeCompare(a.record.savedAt));
      readable
        .splice(DRAFT_MAX_PER_TYPE)
        .forEach((entry) => storage.removeItem(draftKey(entry.identity)));
    } catch (error) {
      this.failureReason(error, 'list');
      return { status: 'unavailable' };
    }
    return { status: 'ok', entries: [...readable, ...unreadable] };
  }

  /** Removes one draft; succeeds if there was none. */
  remove(identity: DraftIdentity): DraftRemoveResult {
    try {
      const storage = this.storage();
      if (!storage) {
        return { ok: false, reason: 'unavailable' };
      }
      storage.removeItem(draftKey(identity));
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: this.failureReason(error, 'remove') };
    }
  }

  /**
   * Removes all drafts of a user from this browser. Without a known user ID
   * (e.g. the identity was already reset on logout), all drafts are removed.
   */
  removeUserDrafts(userId?: string | null): DraftRemoveResult {
    const prefix = userId ? draftUserPrefix(userId) : DRAFT_KEY_PREFIX;
    try {
      const storage = this.storage();
      if (!storage) {
        return { ok: false, reason: 'unavailable' };
      }
      this.keysWithPrefix(storage, prefix).forEach((key) =>
        storage.removeItem(key)
      );
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: this.failureReason(error, 'cleanup') };
    }
  }

  /**
   * Removes expired readable drafts of all users. Run at application start,
   * so drafts of users who don't return still disappear. Never throws.
   */
  pruneExpired(): void {
    try {
      const storage = this.storage();
      if (!storage) {
        return;
      }
      const now = Date.now();
      for (const key of this.keysWithPrefix(storage, DRAFT_KEY_PREFIX)) {
        const savedAt = this.savedAtOf(storage.getItem(key));
        if (savedAt !== null && now - savedAt > DRAFT_RETENTION_MS) {
          storage.removeItem(key);
        }
      }
    } catch (error) {
      this.failureReason(error, 'prune');
    }
  }

  /**
   * Accessing `localStorage` itself can throw (e.g. blocked storage), so
   * callers invoke this inside their try block.
   */
  private storage(): Storage | null {
    return typeof localStorage === 'undefined' ? null : localStorage;
  }

  /** Collects keys first: removing while iterating shifts the indexes. */
  private keysWithPrefix(storage: Storage, prefix: string): string[] {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key?.startsWith(prefix)) {
        keys.push(key);
      }
    }
    return keys;
  }

  private parse(raw: string, identity: DraftIdentity): DraftLoadResult {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { status: 'invalid', reason: 'malformed' };
    }
    return this.validate(parsed, identity);
  }

  private isExpired(record: DraftRecord, now: number): boolean {
    return now - Date.parse(record.savedAt) > DRAFT_RETENTION_MS;
  }

  /** Save time of a raw record of the current schema, or null if unknown. */
  private savedAtOf(raw: string | null): number | null {
    try {
      const value = JSON.parse(raw ?? '');
      if (
        !isObject(value) ||
        value.schemaVersion !== DRAFT_SCHEMA_VERSION ||
        typeof value.savedAt !== 'string'
      ) {
        return null;
      }
      const time = Date.parse(value.savedAt);
      return isNaN(time) ? null : time;
    } catch {
      return null;
    }
  }

  /**
   * Structural check of a parsed record. The stored identity must match the
   * key it was read from, so a renamed or copied key is never offered.
   */
  private validate(value: unknown, identity: DraftIdentity): DraftLoadResult {
    if (!isObject(value)) {
      return { status: 'invalid', reason: 'malformed' };
    }
    if (value.schemaVersion !== DRAFT_SCHEMA_VERSION) {
      return { status: 'invalid', reason: 'unsupported-version' };
    }
    const recordIdentity = value.identity;
    const valid =
      isObject(recordIdentity) &&
      recordIdentity.userId === identity.userId &&
      recordIdentity.type === identity.type &&
      recordIdentity.id === identity.id &&
      typeof value.savedAt === 'string' &&
      !isNaN(Date.parse(value.savedAt)) &&
      (identity.type === 'note'
        ? isNoteForm(value.form) && isNoteOptions(value.options)
        : isBookmarkForm(value.form) && isBookmarkOptions(value.options));
    return valid
      ? { status: 'found', record: value as unknown as DraftRecord }
      : { status: 'invalid', reason: 'incomplete' };
  }

  /** Maps a storage exception to a failure reason and logs it. */
  private failureReason(error: unknown, operation: string): DraftFailureReason {
    const name = (error as { name?: string })?.name;
    const reason: DraftFailureReason =
      name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED'
        ? 'quota'
        : name === 'SecurityError'
          ? 'unavailable'
          : 'error';
    // Only operation metadata is logged, never draft content.
    console.warn(`Draft storage ${operation} failed (${reason}, ${name})`);
    return reason;
  }
}

type Obj = Record<string, unknown>;

function isObject(value: unknown): value is Obj {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const isString = (value: unknown) => typeof value === 'string';
const isNullableString = (value: unknown) => value === null || isString(value);
const isStringArray = (value: unknown) =>
  Array.isArray(value) && value.every(isString);
const isRows = (value: unknown) =>
  Array.isArray(value) &&
  value.every(
    (row) => isObject(row) && isString(row.label) && isString(row.value)
  );

function isNoteForm(value: unknown): value is NoteDraftForm {
  return (
    isObject(value) &&
    isString(value.title) &&
    isString(value.reference) &&
    isStringArray(value.tags) &&
    isString(value.content) &&
    typeof value.public === 'boolean' &&
    isRows(value.copyableFields)
  );
}

function isNoteOptions(value: unknown): value is NoteDraftOptions {
  return isObject(value) && isStringArray(value.collectionIds);
}

function isBookmarkForm(value: unknown): value is BookmarkDraftForm {
  return (
    isObject(value) &&
    isString(value.name) &&
    isString(value.location) &&
    isStringArray(value.tags) &&
    isNullableString(value.publishedOn) &&
    isString(value.sourceCodeURL) &&
    isString(value.description) &&
    typeof value.public === 'boolean' &&
    isNullableString(value.language) &&
    isNullableString(value.youtubeVideoId) &&
    isNullableString(value.stackoverflowQuestionId) &&
    isRows(value.copyableFields)
  );
}

function isBookmarkOptions(value: unknown): value is BookmarkDraftOptions {
  return (
    isObject(value) &&
    typeof value.readLater === 'boolean' &&
    typeof value.pinned === 'boolean' &&
    isStringArray(value.collectionIds)
  );
}
