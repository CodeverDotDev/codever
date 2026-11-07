import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DraftService } from './draft.service';
import {
  BookmarkDraftSnapshot,
  createDraftIdentity,
  DRAFT_MAX_PER_TYPE,
  DRAFT_RETENTION_MS,
  draftKey,
  NoteDraftSnapshot,
} from '../model/entry-draft';

const noteSnapshot = (title = 'My note'): NoteDraftSnapshot => ({
  form: {
    title,
    reference: '',
    tags: ['angular'],
    content: 'Some content',
    public: false,
    copyableFields: [{ label: 'user', value: '' }],
  },
  options: { collectionIds: ['c1'] },
});

const bookmarkSnapshot = (): BookmarkDraftSnapshot => ({
  form: {
    name: 'Codever',
    location: 'https://www.codever.dev',
    tags: ['dev'],
    publishedOn: null,
    sourceCodeURL: '',
    description: 'desc',
    public: false,
    language: null,
    youtubeVideoId: null,
    stackoverflowQuestionId: null,
    copyableFields: [],
  },
  options: { readLater: true, pinned: false, collectionIds: [] },
});

describe('DraftService', () => {
  let service: DraftService;
  const note = createDraftIdentity('user-1', 'note');
  const bookmark = createDraftIdentity('user-1', 'bookmark');

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    service = new DraftService();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('saves to localStorage only and loads the record back', () => {
    const result = service.save(note, noteSnapshot());
    expect(result.ok).toBe(true);
    expect(localStorage.getItem(draftKey(note))).not.toBeNull();
    expect(sessionStorage.length).toBe(0);

    const loaded = service.load(note);
    expect(loaded.status).toBe('found');
    if (loaded.status === 'found') {
      expect(loaded.record.form).toEqual(noteSnapshot().form);
      expect(loaded.record.options).toEqual({ collectionIds: ['c1'] });
      expect(loaded.record.identity).toEqual(note);
      expect(loaded.record.schemaVersion).toBe(2);
    }
  });

  it('returns none when no draft exists', () => {
    expect(service.load(note)).toEqual({ status: 'none' });
  });

  it('keeps note and bookmark drafts separate', () => {
    service.save(note, noteSnapshot());
    service.save(bookmark, bookmarkSnapshot());
    service.remove(note);
    expect(service.load(note).status).toBe('none');
    expect(service.load(bookmark).status).toBe('found');
  });

  it('isolates users', () => {
    service.save(note, noteSnapshot());
    expect(
      service.load(createDraftIdentity('user-2', 'note')).status
    ).toBe('none');
  });

  it('reports malformed JSON as invalid without removing it', () => {
    localStorage.setItem(draftKey(note), '{not json');
    expect(service.load(note)).toEqual({
      status: 'invalid',
      reason: 'malformed',
    });
    expect(localStorage.getItem(draftKey(note))).toBe('{not json');
  });

  it('reports unsupported schema versions', () => {
    service.save(note, noteSnapshot());
    const raw = JSON.parse(localStorage.getItem(draftKey(note)));
    raw.schemaVersion = 99;
    localStorage.setItem(draftKey(note), JSON.stringify(raw));
    expect(service.load(note)).toEqual({
      status: 'invalid',
      reason: 'unsupported-version',
    });
  });

  it('reports incomplete records and identity mismatches', () => {
    service.save(note, noteSnapshot());
    const raw = JSON.parse(localStorage.getItem(draftKey(note)));
    delete raw.form.content;
    localStorage.setItem(draftKey(note), JSON.stringify(raw));
    expect(service.load(note)).toEqual({
      status: 'invalid',
      reason: 'incomplete',
    });

    service.save(note, noteSnapshot());
    const other = JSON.parse(localStorage.getItem(draftKey(note)));
    other.identity.userId = 'someone-else';
    localStorage.setItem(draftKey(note), JSON.stringify(other));
    expect(service.load(note).status).toBe('invalid');
  });

  it('returns a quota failure without throwing or logging content', () => {
    const quota = new DOMException('full', 'QuotaExceededError');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw quota;
    });
    const result = service.save(note, noteSnapshot('secret title'));
    expect(result).toEqual({ ok: false, reason: 'quota' });
    const logged = (console.warn as any).mock.calls.flat().join(' ');
    expect(logged).not.toContain('secret title');
  });

  it('reports unavailable storage on load', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(service.load(note)).toEqual({ status: 'unavailable' });
  });

  it('removes only the given user drafts, or all drafts without a user', () => {
    const other = createDraftIdentity('user-2', 'note');
    service.save(note, noteSnapshot());
    service.save(bookmark, bookmarkSnapshot());
    service.save(other, noteSnapshot());
    localStorage.setItem('unrelated', 'keep');

    expect(service.removeUserDrafts('user-1').ok).toBe(true);
    expect(service.load(note).status).toBe('none');
    expect(service.load(bookmark).status).toBe('none');
    expect(service.load(other).status).toBe('found');

    service.removeUserDrafts(null);
    expect(service.load(other).status).toBe('none');
    expect(localStorage.getItem('unrelated')).toBe('keep');
  });

  it('reports cleanup failures', () => {
    service.save(note, noteSnapshot());
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('boom');
    });
    expect(service.removeUserDrafts('user-1')).toEqual({
      ok: false,
      reason: 'error',
    });
  });

  it('keeps several drafts per type and lists them newest first', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T10:00:00Z'));
    const first = createDraftIdentity('user-1', 'note');
    service.save(first, noteSnapshot('First'));
    vi.setSystemTime(new Date('2026-11-01T11:00:00Z'));
    const second = createDraftIdentity('user-1', 'note');
    service.save(second, noteSnapshot('Second'));
    localStorage.setItem(draftKey(createDraftIdentity('user-1', 'note')), '{x');
    service.save(bookmark, bookmarkSnapshot());

    const result = service.list('user-1', 'note');
    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.entries.map((e) => e.identity.id).slice(0, 2)).toEqual([
        second.id,
        first.id,
      ]);
      expect(result.entries).toHaveLength(3);
      expect(result.entries[2]).toMatchObject({ invalidReason: 'malformed' });
    }
  });

  it('trims readable drafts beyond the cap, oldest first', () => {
    vi.useFakeTimers();
    const ids: string[] = [];
    for (let i = 0; i <= DRAFT_MAX_PER_TYPE; i++) {
      vi.setSystemTime(new Date(Date.UTC(2026, 10, 1, 10, i)));
      const identity = createDraftIdentity('user-1', 'note');
      ids.push(identity.id);
      service.save(identity, noteSnapshot(`Note ${i}`));
    }
    const result = service.list('user-1', 'note');
    expect(result.status === 'ok' && result.entries.length).toBe(
      DRAFT_MAX_PER_TYPE
    );
    expect(
      localStorage.getItem(
        draftKey(createDraftIdentity('user-1', 'note', ids[0]))
      )
    ).toBeNull();
  });

  it('removes expired drafts on load, list and app-start pruning', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T10:00:00Z'));
    const old = createDraftIdentity('user-1', 'note');
    const otherUser = createDraftIdentity('user-2', 'bookmark');
    service.save(old, noteSnapshot());
    service.save(otherUser, bookmarkSnapshot());
    service.save(note, noteSnapshot());
    vi.setSystemTime(new Date(Date.now() + DRAFT_RETENTION_MS + 1));

    expect(service.load(note)).toEqual({ status: 'none' });
    const listed = service.list('user-1', 'note');
    expect(listed.status === 'ok' && listed.entries).toEqual([]);
    expect(localStorage.getItem(draftKey(otherUser))).not.toBeNull();
    localStorage.setItem('unrelated', 'keep');
    service.pruneExpired();
    expect(localStorage.getItem(draftKey(otherUser))).toBeNull();
    expect(localStorage.getItem('unrelated')).toBe('keep');
  });

  it('reports unavailable storage when listing', () => {
    vi.spyOn(Storage.prototype, 'key').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    service.save(note, noteSnapshot());
    expect(service.list('user-1', 'note')).toEqual({ status: 'unavailable' });
  });
});
