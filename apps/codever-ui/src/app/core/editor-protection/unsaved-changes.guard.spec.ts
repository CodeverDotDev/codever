import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom, isObservable, Observable, of } from 'rxjs';
import { EditorProtectionRegistry } from './editor-protection.registry';
import { unsavedChangesGuard } from './unsaved-changes.guard';
import { createDraftIdentity, draftKey, NoteDraftSnapshot } from '../model/entry-draft';
import { DraftService } from '../cache/draft.service';

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

describe('EditorProtectionRegistry and unsavedChangesGuard', () => {
  let registry: EditorProtectionRegistry;
  let dialogResult: 'stay' | 'leave' | undefined;
  let dialog: { open: ReturnType<typeof vi.fn> };
  let current: NoteDraftSnapshot;

  const runGuard = async (): Promise<boolean> => {
    const result = TestBed.runInInjectionContext(() =>
      unsavedChangesGuard(null, null, null, null)
    );
    return isObservable(result)
      ? firstValueFrom(result as Observable<boolean>)
      : (result as boolean);
  };

  const protection = (draftEligible: boolean) => {
    const p = registry.create<NoteDraftSnapshot>({
      type: 'note',
      draftEligible,
      capture: () => structuredClone(current),
    });
    p.markInitial();
    p.setIdentity('user-1');
    return p;
  };

  beforeEach(() => {
    localStorage.clear();
    current = blankNote();
    dialogResult = 'stay';
    dialog = {
      open: vi.fn(() => ({ afterClosed: () => of(dialogResult) })),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: MatDialog, useValue: dialog }],
    });
    registry = TestBed.inject(EditorProtectionRegistry);
  });

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('allows leaving unchanged editors without a prompt', async () => {
    protection(false);
    expect(await runGuard()).toBe(true);
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('prompts for changed edits and stays on Stay', async () => {
    const p = protection(false);
    current.form.title = 'Edited';
    p.notifyChange();
    expect(await runGuard()).toBe(false);
    expect(dialog.open).toHaveBeenCalledTimes(1);
    expect(p.isArmed()).toBe(true);
  });

  it('leaves and disarms on Leave without modifying drafts', async () => {
    const p = protection(false);
    current.form.title = 'Edited';
    p.notifyChange();
    dialogResult = 'leave';
    expect(await runGuard()).toBe(true);
    expect(p.isArmed()).toBe(false);
    expect(localStorage.length).toBe(0);
  });

  it('flushes pending draft changes and leaves silently when protected', async () => {
    const p = protection(true);
    current.form.title = 'Draft me';
    p.notifyChange();
    expect(await runGuard()).toBe(true);
    expect(dialog.open).not.toHaveBeenCalled();
    expect(noteTitles()).toEqual(['Draft me']);

  });

  it('prompts when a draft write failed', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const p = protection(true);
    current.form.title = 'Lost?';
    p.notifyChange();
    expect(await runGuard()).toBe(false);
    vi.restoreAllMocks();
  });

  it('arms beforeunload only while changed', () => {
    const p = protection(false);
    const unprompted = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(unprompted);
    expect(unprompted.defaultPrevented).toBe(false);

    current.form.title = 'Changed';
    p.notifyChange();
    const prompted = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(prompted);
    expect(prompted.defaultPrevented).toBe(true);

    p.markSaved();
    const afterSave = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(afterSave);
    expect(afterSave.defaultPrevented).toBe(false);
    p.destroy();
  });

  const fireBeforeUnload = () => {
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  };

  /** Readable note drafts stored for user-1. */
  const noteTitles = () => {
    const result = TestBed.inject(DraftService).list('user-1', 'note');
    return result.status === 'ok'
      ? result.entries.map((entry) =>
          'record' in entry ? entry.record.form['title'] : null
        )
      : [];
  };

  it('stores pending create input on close and does not prompt', () => {
    const p = protection(true);
    current.form.title = 'Survives closing';
    p.notifyChange();
    expect(fireBeforeUnload()).toBe(false);
    expect(noteTitles()).toEqual(['Survives closing']);
    p.destroy();
  });

  it('prompts on close when the draft write fails', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const p = protection(true);
    current.form.title = 'Lost?';
    p.notifyChange();
    expect(fireBeforeUnload()).toBe(true);
    p.destroy();
    vi.restoreAllMocks();
  });

  it('does not prompt for stored drafts after leaving the form', () => {
    const p = protection(true);
    current.form.title = 'Kept in the list';
    p.notifyChange();
    p.destroy();
    expect(registry.isArmed()).toBe(false);
    expect(fireBeforeUnload()).toBe(false);
    expect(noteTitles()).toEqual(['Kept in the list']);
  });
  it('disarms for stored drafts on logout, even if cleanup failed', () => {
    const p = protection(true);
    current.form.title = 'Private';
    p.notifyChange();
    p.flush();
    p.destroy();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(registry.handleLogout('user-1').ok).toBe(false);
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    vi.restoreAllMocks();
  });

  it('flushes on pagehide', () => {
    const p = protection(true);
    current.form.title = 'Hidden';
    p.notifyChange();
    window.dispatchEvent(new Event('pagehide'));
    expect(noteTitles()).toEqual(['Hidden']);

    p.destroy();
  });

  it('logout stops writers, disarms and removes the user drafts', () => {
    const draftService = TestBed.inject(DraftService);
    const other = createDraftIdentity('other', 'note');
    draftService.save(other, blankNote());
    const p = protection(true);
    current.form.title = 'Private';
    p.notifyChange();
    p.flush();

    expect(registry.handleLogout(null).ok).toBe(true);
    expect(p.isArmed()).toBe(false);
    expect(p.state()).toBe('ended');
    expect(noteTitles()).toEqual([]);
    // the remembered user id is used, other users are kept
    expect(localStorage.getItem(draftKey(other))).not.toBeNull();
  });
});
