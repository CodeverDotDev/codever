import { signal } from '@angular/core';
import {
  createDraftIdentity,
  DraftIdentity,
  DraftResourceType,
  DraftSnapshot,
} from '../model/entry-draft';
import { DraftInvalidReason, DraftService } from '../cache/draft.service';
import { snapshotKey } from './snapshot';

export const DRAFT_AUTOSAVE_DELAY_MS = 1000;

/**
 * - `ineligible`: no draft session; changes are warning-protected only.
 * - `waiting`: eligible, waiting for the initial content and the identity.
 * - `unavailable`: storage cannot be used in this browser.
 * - `active`: changes are autosaved; stored drafts are offered.
 * - `suspended`: drafting stopped for this visit (notebook mode).
 * - `ended`: saved, left without saving, or logged out.
 */
export type DraftSessionState =
  | 'ineligible'
  | 'waiting'
  | 'unavailable'
  | 'active'
  | 'suspended'
  | 'ended';

export type DraftWriteStatus = 'idle' | 'saved' | 'failed';

/** A stored draft the user can restore (if readable) or delete. */
export interface DraftOffer {
  id: string;
  readable: boolean;
  /** Last save time; null for unreadable drafts. */
  savedAt: string | null;
  /** Short label (e.g. title); null when untitled or unreadable. */
  label: string | null;
  invalidReason: DraftInvalidReason | null;
}

export interface AuthoringProtectionConfig<S extends DraftSnapshot> {
  type: DraftResourceType;
  /** Only blank-start creates acquire a draft session. */
  draftEligible: boolean;
  /** Raw editable values; used for drafts and change tracking. */
  capture: () => S;
  /** Applies a restored snapshot with events suppressed. */
  apply?: (snapshot: S) => void;
  /** Extra state relevant to change tracking but not stored in drafts. */
  trackExtra?: () => unknown;
  /** Short label of an offered draft (e.g. its title) shown in the list. */
  describe?: (snapshot: S) => string | null | undefined;
}

/** Longest offered-draft label shown before it is cut with an ellipsis. */
export const DRAFT_OFFER_LABEL_MAX_LENGTH = 80;

export interface AuthoringProtectionHost {
  updateArming(): void;
  rememberUser(userId: string): void;
  unregister(protection: AuthoringProtection): void;
}

/**
 * Change tracking, optional create-draft session, and unsaved-changes state
 * of one editor visit. An eligible visit writes to its own draft, created on
 * the first change, and offers the user's other stored drafts.
 */
export class AuthoringProtection<S extends DraftSnapshot = DraftSnapshot> {
  readonly wasEligible: boolean;
  readonly state = signal<DraftSessionState>('ineligible');
  /** Other stored drafts of this type, newest first, unreadable last. */
  readonly offers = signal<DraftOffer[]>([]);
  /** Set when a chosen draft was removed meanwhile (e.g. in another tab). */
  readonly offerMissing = signal(false);
  readonly writeStatus = signal<DraftWriteStatus>('idle');
  readonly lastSavedAt = signal<string | null>(null);
  readonly changed = signal(false);
  readonly cleanupFailed = signal(false);

  private initialKey: string | null = null;
  private lastWrittenKey: string | null = null;
  /** Whether `current` is stored because this visit wrote or restored it. */
  private ownsDraft = false;
  private disarmed = false;
  /** Form state right after the last restore; null when nothing restored. */
  private restoredKey: string | null = null;
  private userId: string | null = null;
  /** The draft this visit writes to; assigned on the first write. */
  private current: DraftIdentity | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly config: AuthoringProtectionConfig<S>,
    private readonly draftService: DraftService,
    private readonly host: AuthoringProtectionHost
  ) {
    this.wasEligible = config.draftEligible;
    this.state.set(config.draftEligible ? 'waiting' : 'ineligible');
  }

  get hasInitialSnapshot(): boolean {
    return this.initialKey !== null;
  }

  /** Records the initial snapshot once the initial content has settled. */
  markInitial(): void {
    this.initialKey = this.currentKey();
    this.refreshChanged();
    this.tryActivate();
  }

  /**
   * Re-baselines after prefill-initiated metadata, but only while the user
   * has not changed anything yet; otherwise the update counts as a change.
   */
  acceptInitialUpdate(wasUnchanged: boolean): void {
    if (wasUnchanged && this.initialKey !== null) {
      this.initialKey = this.currentKey();
      this.refreshChanged();
    } else {
      this.notifyChange();
    }
  }

  setIdentity(userId: string | null | undefined): void {
    if (!userId || this.state() === 'ended') {
      return;
    }
    this.host.rememberUser(userId);
    if (this.userId === userId) {
      return;
    }
    const switched = this.userId !== null;
    this.userId = userId;
    if (switched) {
      // Input of the previous user must never land in the new user's drafts.
      this.suspendDrafting();
      return;
    }
    this.tryActivate();
  }

  /** Call after any form change, including event-suppressed patches. */
  notifyChange(): void {
    this.refreshChanged();
    if (this.state() === 'active') {
      this.cancelTimer();
      this.timer = setTimeout(() => {
        this.timer = null;
        this.write();
      }, DRAFT_AUTOSAVE_DELAY_MS);
    }
  }

  /** Synchronously writes pending eligible changes. */
  flush(): void {
    this.cancelTimer();
    if (this.state() !== 'active' || this.initialKey === null) {
      return;
    }
    if (this.currentKey() !== (this.lastWrittenKey ?? this.initialKey)) {
      this.write();
    }
  }

  isChanged(): boolean {
    return this.initialKey !== null && this.currentKey() !== this.initialKey;
  }

  /**
   * Whether a `beforeunload` listener is needed: any change. The registry
   * flushes first and prompts only for changes still unprotected.
   */
  isArmed(): boolean {
    return !this.disarmed && this.isChanged();
  }

  /** Changes that neither are saved nor match the last successful draft. */
  hasUnprotectedChanges(): boolean {
    if (this.disarmed || !this.isChanged()) {
      return false;
    }
    return !(
      this.state() === 'active' && this.lastWrittenKey === this.currentKey()
    );
  }

  /**
   * Replaces the form with a stored draft, which this visit then continues.
   * Pending input is flushed first, so it stays available as its own draft.
   * Returns false if the draft is gone or unreadable.
   */
  restore(id: string): boolean {
    if (this.state() !== 'active' || !this.userId) {
      return false;
    }
    this.flush();
    const identity = createDraftIdentity(this.userId, this.config.type, id);
    const result = this.draftService.load(identity);
    if (result.status !== 'found') {
      this.offerMissing.set(result.status === 'none');
      this.refreshOffers();
      return false;
    }
    this.config.apply?.({
      form: result.record.form,
      options: result.record.options,
    } as S);
    this.current = identity;
    this.ownsDraft = true;
    this.lastWrittenKey = this.currentKey();
    this.restoredKey = this.lastWrittenKey;
    this.lastSavedAt.set(null);
    this.writeStatus.set('idle');
    this.offerMissing.set(false);
    this.refreshOffers();
    this.refreshChanged();
    return true;
  }

  /** Removes an offered (or unreadable) draft; current input is kept. */
  deleteOffer(id: string): void {
    if (!this.userId || this.current?.id === id) {
      return;
    }
    const result = this.draftService.remove(
      createDraftIdentity(this.userId, this.config.type, id)
    );
    this.cleanupFailed.set(!result.ok);
    this.offerMissing.set(false);
    this.refreshOffers();
  }

  /** Stops drafting for the rest of this visit, leaving stored drafts. */
  suspendDrafting(): void {
    if (!this.wasEligible || this.state() === 'ended') {
      return;
    }
    this.cancelTimer();
    this.ownsDraft = false;
    this.current = null;
    this.lastWrittenKey = null;
    this.offers.set([]);
    this.state.set('suspended');
  }

  /**
   * Whether Cancel must confirm discarding a new entry: an active create
   * draft session with changes. A restored draft left as restored is kept,
   * so cancelling it needs no confirmation.
   */
  needsDiscardConfirmation(): boolean {
    if (this.disarmed || this.state() !== 'active' || !this.isChanged()) {
      return false;
    }
    return this.restoredKey === null || this.currentKey() !== this.restoredKey;
  }

  /**
   * Call on a successful resource response, before secondary side effects.
   * Clears only the draft this visit restored or wrote, and disarms.
   */
  markSaved(): void {
    this.removeOwnDraftAndEnd();
  }

  /**
   * Explicit Cancel of a new entry: removes the draft this visit wrote or
   * restored, and disarms. Other listed drafts are untouched.
   */
  discard(): void {
    this.removeOwnDraftAndEnd();
  }

  /** Stops writing and disarms without touching stored drafts. */
  end(): void {
    this.cancelTimer();
    this.disarmed = true;
    this.state.set('ended');
    this.host.updateArming();
  }

  /** Editor teardown: flush pending changes, then unregister. */
  destroy(): void {
    this.flush();
    this.cancelTimer();
    this.host.unregister(this as AuthoringProtection);
  }

  private removeOwnDraftAndEnd(): void {
    this.cancelTimer();
    if (this.ownsDraft && this.current) {
      const result = this.draftService.remove(this.current);
      this.cleanupFailed.set(!result.ok);
    }
    this.ownsDraft = false;
    this.end();
  }

  /**
   * Starts the draft session once the initial snapshot and the identity are
   * both known: lists stored drafts and activates autosave.
   */
  private tryActivate(): void {
    if (
      this.state() !== 'waiting' ||
      this.initialKey === null ||
      !this.userId
    ) {
      return;
    }
    if (!this.refreshOffers()) {
      this.state.set('unavailable');
      return;
    }
    this.state.set('active');
    if (this.isChanged()) {
      this.notifyChange();
    }
  }

  /**
   * Reloads the offered drafts, excluding the one this visit writes to.
   * Returns false when storage is unavailable.
   */
  private refreshOffers(): boolean {
    if (!this.userId) {
      return false;
    }
    const result = this.draftService.list(this.userId, this.config.type);
    if (result.status === 'unavailable') {
      this.offers.set([]);
      return false;
    }
    this.offers.set(
      result.entries
        .filter((entry) => entry.identity.id !== this.current?.id)
        .map((entry) =>
          'record' in entry
            ? {
                id: entry.identity.id,
                readable: true,
                savedAt: entry.record.savedAt,
                label: this.describeOffer({
                  form: entry.record.form,
                  options: entry.record.options,
                } as S),
                invalidReason: null,
              }
            : {
                id: entry.identity.id,
                readable: false,
                savedAt: null,
                label: null,
                invalidReason: entry.invalidReason,
              }
        )
    );
    return true;
  }

  /**
   * Stores the current snapshot in this visit's draft, creating it on the
   * first write. A form back at its initial (blank) state removes the draft
   * instead, so an emptied create leaves nothing behind.
   */
  private write(): void {
    if (this.state() !== 'active' || !this.userId || this.disarmed) {
      return;
    }
    const snapshot = this.config.capture();
    const key = this.trackedKey(snapshot);
    if (key === this.initialKey) {
      const result = this.current
        ? this.draftService.remove(this.current)
        : ({ ok: true } as const);
      if (result.ok) {
        this.ownsDraft = false;
        this.lastWrittenKey = null;
        this.lastSavedAt.set(null);
        this.writeStatus.set('idle');
      } else {
        this.writeStatus.set('failed');
      }
      return;
    }
    const created = !this.current;
    this.current ??= createDraftIdentity(this.userId, this.config.type);
    const result = this.draftService.save(this.current, snapshot);
    if (result.ok) {
      this.ownsDraft = true;
      this.lastWrittenKey = key;
      this.lastSavedAt.set(result.record.savedAt);
      this.writeStatus.set('saved');
      if (created) {
        // A new draft may have pushed the oldest one over the cap.
        this.refreshOffers();
      }
    } else {
      this.writeStatus.set('failed');
    }
  }

  /**
   * Single-line, length-capped label of an offered draft. Blank labels and
   * failures of the editor's `describe` give null, shown as untitled.
   */
  private describeOffer(snapshot: S): string | null {
    let label: string | null | undefined;
    try {
      label = this.config.describe?.(snapshot);
    } catch {
      return null;
    }
    const text = (label ?? '').replace(/\s+/g, ' ').trim();
    if (!text) {
      return null;
    }
    return text.length > DRAFT_OFFER_LABEL_MAX_LENGTH
      ? `${text.slice(0, DRAFT_OFFER_LABEL_MAX_LENGTH - 1)}…`
      : text;
  }

  /** Updates the `changed` signal and lets the host re-arm beforeunload. */
  private refreshChanged(): void {
    this.changed.set(this.isChanged());
    this.host.updateArming();
  }

  private currentKey(): string {
    return this.trackedKey(this.config.capture());
  }

  /**
   * Comparison key of a snapshot plus the untracked-by-drafts extra state,
   * so a notebook change differs from the initial state and last write.
   */
  private trackedKey(snapshot: S): string {
    return snapshotKey({
      snapshot,
      extra: this.config.trackExtra ? this.config.trackExtra() : null,
    });
  }

  private cancelTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
