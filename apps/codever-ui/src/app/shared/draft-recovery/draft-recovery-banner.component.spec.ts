import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { DraftRecoveryBannerComponent } from './draft-recovery-banner.component';
import { AuthoringProtection } from '../../core/editor-protection/authoring-protection';
import { DraftService } from '../../core/cache/draft.service';
import {
  createDraftIdentity,
  draftKey,
  NoteDraftSnapshot,
} from '../../core/model/entry-draft';

const blankNote = (title = ''): NoteDraftSnapshot => ({
  form: {
    title,
    reference: '',
    tags: [],
    content: '',
    public: false,
    copyableFields: [],
  },
  options: { collectionIds: [] },
});

describe('DraftRecoveryBannerComponent', () => {
  let fixture: ComponentFixture<DraftRecoveryBannerComponent>;
  let current: NoteDraftSnapshot;
  let protection: AuthoringProtection<NoteDraftSnapshot>;
  const draftService = new DraftService();

  const setup = async (eligible = true) => {
    protection = new AuthoringProtection<NoteDraftSnapshot>(
      {
        type: 'note',
        draftEligible: eligible,
        capture: () => structuredClone(current),
        apply: (s) => (current = structuredClone(s)),
        describe: (s) => s.form.title,
      },
      draftService,
      { updateArming: vi.fn(), rememberUser: vi.fn(), unregister: vi.fn() }
    );
    protection.markInitial();
    protection.setIdentity('user-1');
    await TestBed.configureTestingModule({
      imports: [DraftRecoveryBannerComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    fixture = TestBed.createComponent(DraftRecoveryBannerComponent);
    fixture.componentRef.setInput('protection', protection);
    await fixture.whenStable();
  };

  /** Stores a note draft of user-1 with a distinct save time. */
  let clock = Date.UTC(2026, 10, 1, 10);
  const seed = (snapshot: NoteDraftSnapshot) => {
    clock += 60_000;
    vi.setSystemTime(clock);
    const identity = createDraftIdentity('user-1', 'note');
    draftService.save(identity, snapshot);
    return identity;
  };

  const text = () => fixture.nativeElement.textContent as string;
  const buttons = (label: string) =>
    Array.from(
      fixture.nativeElement.querySelectorAll('button') as HTMLButtonElement[]
    ).filter((b) => b.textContent.trim() === label);
  const button = (label: string) => buttons(label)[0];
  const labels = () =>
    Array.from(
      fixture.nativeElement.querySelectorAll('.draft-recovery-label') as Element[]
    ).map((l) => l.textContent);

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    localStorage.clear();
    current = blankNote();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('renders nothing for ineligible editors', async () => {
    await setup(false);
    expect(text().trim()).toBe('');
  });

  it('shows the browser retention note for eligible creates', async () => {
    await setup();
    expect(text()).toContain('kept in this browser for 7 days');
    expect(text()).toContain('removed when you log out');
  });

  it('lists stored drafts newest first with their titles', async () => {
    seed(blankNote('Older'));
    seed(blankNote('Newer'));
    await setup();
    expect(text()).toContain('drafts (2)');
    expect(labels()).toEqual(['Newer', 'Older']);
    expect(buttons('Restore').length).toBe(2);
    expect(buttons('Delete').length).toBe(2);
  });

  it('restores a draft into an untouched form', async () => {
    seed(blankNote('Old'));
    await setup();
    button('Restore').click();
    await fixture.whenStable();
    expect(current.form.title).toBe('Old');
    expect(protection.state()).toBe('active');
    expect(labels()).toEqual([]);
  });

  it('marks a draft without a title as untitled', async () => {
    const draft = blankNote('   ');
    draft.form.content = 'Body only';
    seed(draft);
    await setup();
    expect(text()).toContain('(untitled)');
  });

  it('shows long or multiline titles on one capped line', async () => {
    seed(blankNote(`Line one\n${'x'.repeat(200)}`));
    await setup();
    const [label] = labels();
    expect(label.startsWith('Line one x')).toBe(true);
    expect(label.length).toBe(80);
    expect(label.endsWith('…')).toBe(true);
  });

  it('asks before replacing changed input, per draft', async () => {
    seed(blankNote('Old'));
    await setup();
    current.form.title = 'Typed';
    protection.notifyChange();
    await fixture.whenStable();
    button('Restore').click();
    await fixture.whenStable();
    expect(current.form.title).toBe('Typed');
    expect(text()).toContain('Your current input stays in the draft list');
    button('Keep current input').click();
    await fixture.whenStable();
    expect(current.form.title).toBe('Typed');

    button('Restore').click();
    await fixture.whenStable();
    button('Replace with draft').click();
    await fixture.whenStable();
    expect(current.form.title).toBe('Old');
    expect(labels()).toEqual(['Typed']);
  });

  it('deletes a draft and keeps the current input', async () => {
    const old = seed(blankNote('Old'));
    await setup();
    current.form.title = 'Typed';
    protection.notifyChange();
    button('Delete').click();
    await fixture.whenStable();
    expect(localStorage.getItem(draftKey(old))).toBeNull();
    expect(current.form.title).toBe('Typed');
    expect(labels()).toEqual([]);
  });

  it('reports a draft removed in another tab', async () => {
    const old = seed(blankNote('Old'));
    await setup();
    draftService.remove(old);
    button('Restore').click();
    await fixture.whenStable();
    expect(text()).toContain('no longer available');
    expect(current.form.title).toBe('');
  });

  it('reports a failed draft write', async () => {
    await setup();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    current.form.title = 'Typed';
    protection.notifyChange();
    protection.flush();
    await fixture.whenStable();
    expect(text()).toContain('latest changes are not saved as a draft');
  });

  it('reports unavailable storage', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, 'key').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    localStorage.setItem('x', 'y');
    await setup();
    expect(text()).toContain('Drafts are unavailable in this browser');
  });

  it('uses keyboard-operable native buttons and a status region', async () => {
    seed(blankNote('Old'));
    await setup();
    const all = Array.from(
      fixture.nativeElement.querySelectorAll('button') as HTMLButtonElement[]
    );
    expect(all.length).toBe(2);
    all.forEach((b) => {
      expect(b.type).toBe('button');
      expect(b.tabIndex).toBe(0);
    });
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();
  });

  it('lists unreadable drafts for deletion only', async () => {
    const broken = createDraftIdentity('user-1', 'note');
    localStorage.setItem(draftKey(broken), '{bad');
    await setup();
    expect(text()).toContain('Unreadable draft');
    expect(buttons('Restore').length).toBe(0);
    button('Delete').click();
    await fixture.whenStable();
    expect(localStorage.getItem(draftKey(broken))).toBeNull();
  });
});
