import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AuthoringProtection,
  AuthoringProtectionHost,
  DRAFT_AUTOSAVE_DELAY_MS,
} from './authoring-protection';
import { DraftService } from '../cache/draft.service';
import {
  createDraftIdentity,
  draftKey,
  DraftRecord,
  NoteDraftSnapshot,
} from '../model/entry-draft';

const blankNote = (): NoteDraftSnapshot => ({
  form: {
    title: '',
    reference: '',
    tags: [],
    content: '',
    public: false,
    copyableFields: [],
  },
  options: { collectionIds: [] },
});

const titled = (title: string): NoteDraftSnapshot => {
  const snapshot = blankNote();
  snapshot.form.title = title;
  return snapshot;
};

describe('AuthoringProtection', () => {
  let current: NoteDraftSnapshot;
  let extra: unknown;
  let host: AuthoringProtectionHost;
  let draftService: DraftService;

  const create = (draftEligible = true) =>
    new AuthoringProtection<NoteDraftSnapshot>(
      {
        type: 'note',
        draftEligible,
        capture: () => structuredClone(current),
        apply: (snapshot) => (current = structuredClone(snapshot)),
        trackExtra: () => extra,
        describe: (snapshot) => snapshot.form.title,
      },
      draftService,
      host
    );

  const edit = (p: AuthoringProtection, title: string) => {
    current.form.title = title;
    p.notifyChange();
  };

  /** Readable stored note drafts of a user, newest first. */
  type NoteRecord = DraftRecord<
    NoteDraftSnapshot['form'],
    NoteDraftSnapshot['options']
  >;
  const records = (userId = 'user-1'): NoteRecord[] => {
    const result = draftService.list(userId, 'note');
    return result.status === 'ok'
      ? result.entries.flatMap((entry) =>
          'record' in entry ? [entry.record as NoteRecord] : []
        )
      : [];
  };
  const stored = () => records()[0] ?? null;
  const titles = () => records().map((record) => record.form.title);

  /** Stores a draft of user-1 one minute after the previous one. */
  const seed = (title: string) => {
    vi.advanceTimersByTime(60_000);
    const identity = createDraftIdentity('user-1', 'note');
    draftService.save(identity, titled(title));
    return identity;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    current = blankNote();
    extra = null;
    host = {
      updateArming: vi.fn(),
      rememberUser: vi.fn(),
      unregister: vi.fn(),
    };
    draftService = new DraftService();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  const activeProtection = () => {
    const p = create();
    p.markInitial();
    p.setIdentity('user-1');
    expect(p.state()).toBe('active');
    return p;
  };

  it('does not write untouched forms', () => {
    const p = activeProtection();
    vi.advanceTimersByTime(5000);
    p.flush();
    expect(stored()).toBeNull();
    expect(p.isArmed()).toBe(false);
    expect(p.hasUnprotectedChanges()).toBe(false);
  });

  it('autosaves after 1000 ms of inactivity', () => {
    const p = activeProtection();
    edit(p, 'Hello');
    vi.advanceTimersByTime(DRAFT_AUTOSAVE_DELAY_MS - 1);
    expect(stored()).toBeNull();
    expect(p.hasUnprotectedChanges()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(stored().form.title).toBe('Hello');
    expect(p.writeStatus()).toBe('saved');
    expect(p.hasUnprotectedChanges()).toBe(false);
    // The beforeunload listener stays attached; the registry decides.
    expect(p.isArmed()).toBe(true);
  });

  it('keeps writing to the same draft', () => {
    const p = activeProtection();
    edit(p, 'H');
    p.flush();
    edit(p, 'He');
    p.flush();
    expect(titles()).toEqual(['He']);
  });

  it('restarts the debounce on further changes', () => {
    const p = activeProtection();
    edit(p, 'H');
    vi.advanceTimersByTime(800);
    edit(p, 'He');
    vi.advanceTimersByTime(800);
    expect(stored()).toBeNull();
    vi.advanceTimersByTime(200);
    expect(stored().form.title).toBe('He');
  });

  it('removes its draft when the form returns to the initial state', () => {
    const p = activeProtection();
    edit(p, 'Hello');
    vi.advanceTimersByTime(DRAFT_AUTOSAVE_DELAY_MS);
    edit(p, '');
    vi.advanceTimersByTime(DRAFT_AUTOSAVE_DELAY_MS);
    expect(stored()).toBeNull();
    expect(p.isArmed()).toBe(false);
  });

  it('flush writes pending changes synchronously', () => {
    const p = activeProtection();
    edit(p, 'Pending');
    p.flush();
    expect(stored().form.title).toBe('Pending');
  });

  it('tracks event-suppressed patches once notified', () => {
    const p = activeProtection();
    current.options.collectionIds = ['c1'];
    p.notifyChange();
    p.flush();
    expect(stored().options.collectionIds).toEqual(['c1']);
  });

  it('never writes for ineligible editors but still tracks changes', () => {
    const p = create(false);
    p.markInitial();
    p.setIdentity('user-1');
    expect(p.state()).toBe('ineligible');
    edit(p, 'Edited');
    vi.advanceTimersByTime(5000);
    p.flush();
    expect(localStorage.length).toBe(0);
    expect(p.hasUnprotectedChanges()).toBe(true);
    expect(p.isArmed()).toBe(true);
  });

  it('offers stored drafts newest first and autosaves alongside them', () => {
    seed('Older');
    seed('Newer');
    const p = activeProtection();
    expect(p.offers().map((o) => o.label)).toEqual(['Newer', 'Older']);
    expect(p.offers()[0].savedAt).not.toBeNull();

    vi.advanceTimersByTime(60_000);
    edit(p, 'New input');
    p.flush();
    expect(titles()).toEqual(['New input', 'Newer', 'Older']);
    // The visit's own draft is never offered to itself.
    expect(p.offers().map((o) => o.label)).toEqual(['Newer', 'Older']);
    expect(p.hasUnprotectedChanges()).toBe(false);
  });

  it('restores a draft and continues it, keeping current input', () => {
    const older = seed('Older');
    const p = activeProtection();
    edit(p, 'Mine');

    expect(p.restore(older.id)).toBe(true);
    expect(current.form.title).toBe('Older');
    expect(p.hasUnprotectedChanges()).toBe(false);
    // The previous input was flushed and is now offered.
    expect(p.offers().map((o) => o.label)).toEqual(['Mine']);

    edit(p, 'Older, continued');
    p.flush();
    expect(titles().sort()).toEqual(['Mine', 'Older, continued']);
    p.markSaved();
    expect(titles()).toEqual(['Mine']);
  });

  it('reports a draft removed meanwhile instead of restoring it', () => {
    const older = seed('Older');
    const p = activeProtection();
    draftService.remove(older);
    expect(p.restore(older.id)).toBe(false);
    expect(p.offerMissing()).toBe(true);
    expect(p.offers()).toEqual([]);
    expect(current.form.title).toBe('');
  });

  it('deletes an offer and keeps current input', () => {
    const older = seed('Old');
    const p = activeProtection();
    edit(p, 'Mine');
    p.deleteOffer(older.id);
    expect(p.offers()).toEqual([]);
    expect(current.form.title).toBe('Mine');
    p.flush();
    expect(titles()).toEqual(['Mine']);
  });

  it('lists unreadable drafts for deletion and never overwrites them', () => {
    const broken = createDraftIdentity('user-1', 'note');
    localStorage.setItem(draftKey(broken), '{broken');
    const p = activeProtection();
    expect(p.offers()).toEqual([
      expect.objectContaining({ id: broken.id, readable: false }),
    ]);
    edit(p, 'x');
    p.flush();
    expect(localStorage.getItem(draftKey(broken))).toBe('{broken');
    p.deleteOffer(broken.id);
    expect(localStorage.getItem(draftKey(broken))).toBeNull();
    expect(p.offers()).toEqual([]);
  });

  it('reports delete failures', () => {
    const older = seed('Old');
    const p = activeProtection();
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('boom');
    });
    p.deleteOffer(older.id);
    expect(p.cleanupFailed()).toBe(true);
  });

  it('is unavailable when storage cannot be listed', () => {
    vi.spyOn(Storage.prototype, 'key').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    localStorage.setItem('x', 'y');
    const p = create();
    p.markInitial();
    p.setIdentity('user-1');
    expect(p.state()).toBe('unavailable');
  });

  it('reports write failures and stays unprotected', () => {
    const p = activeProtection();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    edit(p, 'Too big');
    p.flush();
    expect(p.writeStatus()).toBe('failed');
    expect(p.hasUnprotectedChanges()).toBe(true);
  });

  it('markSaved removes its own draft and disarms', () => {
    const p = activeProtection();
    edit(p, 'Saved');
    p.flush();
    p.markSaved();
    expect(stored()).toBeNull();
    expect(p.state()).toBe('ended');
    expect(p.isArmed()).toBe(false);
    expect(p.hasUnprotectedChanges()).toBe(false);
  });

  it('markSaved does not remove drafts it never owned', () => {
    seed('Someone else');
    const p = activeProtection();
    p.markSaved();
    expect(titles()).toEqual(['Someone else']);
  });

  it('needs no discard confirmation for an untouched create', () => {
    const p = activeProtection();
    expect(p.needsDiscardConfirmation()).toBe(false);
  });

  it('confirms discarding a changed create, also before the debounce', () => {
    const p = activeProtection();
    edit(p, 'Typed');
    expect(p.needsDiscardConfirmation()).toBe(true);
  });

  it('discard removes only its own draft and disarms', () => {
    seed('Other');
    const p = activeProtection();
    edit(p, 'Mine');
    p.flush();
    expect([...titles()].sort()).toEqual(['Mine', 'Other']);
    p.discard();
    expect(titles()).toEqual(['Other']);
    expect(p.state()).toBe('ended');
    expect(p.hasUnprotectedChanges()).toBe(false);
    vi.advanceTimersByTime(DRAFT_AUTOSAVE_DELAY_MS);
    p.destroy();
    expect(titles()).toEqual(['Other']);
  });

  it('discard drops pending input without writing it', () => {
    const p = activeProtection();
    edit(p, 'Pending');
    p.discard();
    vi.advanceTimersByTime(DRAFT_AUTOSAVE_DELAY_MS);
    p.destroy();
    expect(records()).toEqual([]);
  });

  it('keeps a restored draft unchanged without confirmation', () => {
    const { id } = seed('Restored');
    const p = activeProtection();
    expect(p.restore(id)).toBe(true);
    expect(p.needsDiscardConfirmation()).toBe(false);
  });

  it('confirms and removes a restored draft that was changed', () => {
    const { id } = seed('Restored');
    const p = activeProtection();
    p.restore(id);
    edit(p, 'Restored and changed');
    expect(p.needsDiscardConfirmation()).toBe(true);
    p.discard();
    expect(records()).toEqual([]);
  });

  it('needs no discard confirmation outside an active draft session', () => {
    const edit_ = create(false);
    edit_.markInitial();
    edit_.setIdentity('user-1');
    edit(edit_, 'Changed edit');
    expect(edit_.needsDiscardConfirmation()).toBe(false);

    const notebook = activeProtection();
    notebook.suspendDrafting();
    edit(notebook, 'Notebook');
    expect(notebook.needsDiscardConfirmation()).toBe(false);
  });

  it('suspends drafting for notebooks and keeps the markdown draft', () => {
    const p = activeProtection();
    edit(p, 'Markdown');
    p.flush();
    p.suspendDrafting();
    extra = { notebook: '{"cells":[]}' };
    edit(p, 'Notebook title');
    p.flush();
    expect(titles()).toEqual(['Markdown']);
    expect(p.hasUnprotectedChanges()).toBe(true);
    p.markSaved();
    expect(titles()).toEqual(['Markdown']);
  });

  it('end stops writing without removing drafts', () => {
    const p = activeProtection();
    edit(p, 'Kept');
    p.flush();
    edit(p, 'Later');
    p.end();
    vi.advanceTimersByTime(5000);
    expect(stored().form.title).toBe('Kept');
    expect(p.isArmed()).toBe(false);
  });

  it('switches identity without moving content to the new user', () => {
    const p = activeProtection();
    edit(p, 'User 1 content');
    p.flush();
    p.setIdentity('user-2');
    p.flush();
    expect(stored().form.title).toBe('User 1 content');
    expect(host.rememberUser).toHaveBeenCalledWith('user-2');
    // drafting stops; the input stays guard-protected
    expect(records('user-2')).toEqual([]);
    expect(p.state()).toBe('suspended');
  });

  it('re-baselines prefill updates only while unchanged', () => {
    const p = create(false);
    p.markInitial();
    current.form.title = 'Scraped';
    p.acceptInitialUpdate(true);
    expect(p.isChanged()).toBe(false);

    current.form.title = 'Typed';
    p.notifyChange();
    current.form.content = 'More scraped';
    p.acceptInitialUpdate(false);
    expect(p.isChanged()).toBe(true);
  });

  it('destroy flushes and unregisters', () => {
    const p = activeProtection();
    edit(p, 'Before leave');
    p.destroy();
    expect(stored().form.title).toBe('Before leave');
    expect(host.unregister).toHaveBeenCalledWith(p);
  });
});
