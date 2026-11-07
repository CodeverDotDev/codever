import { provideZoneChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePipe, Location } from '@angular/common';
import { HttpHeaders } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { EMPTY, NEVER, Observable, of, Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NoteEditorComponent } from '../../my-notes/save-note-form/note-editor.component';
import { SaveBookmarkFormComponent } from '../../my-bookmarks/save-bookmark-form/save-bookmark-form.component';
import { AuthenticationService } from '../../core/auth/authentication.service';
import { MarkdownService } from '../../core/markdown/markdown.service';
import { PersonalNotesService } from '../../core/personal-notes.service';
import { PersonalBookmarksService } from '../../core/personal-bookmarks.service';
import { PersonalCollectionsService } from '../../core/personal-collections.service';
import { PublicBookmarksService } from '../../public/bookmarks/public-bookmarks.service';
import { PublicBookmarksStore } from '../../public/bookmarks/store/public-bookmarks-store.service';
import { UserDataService } from '../../core/user-data.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { UserDataStore } from '../../core/user/userdata.store';
import { SuggestedTagsStore } from '../../core/user/suggested-tags.store';
import { MyBookmarksStore } from '../../core/user/my-bookmarks.store';
import { UserDataHistoryStore } from '../../core/user/userdata.history.store';
import { UserDataReadLaterStore } from '../../core/user/userdata.readlater.store';
import { UserDataPinnedStore } from '../../core/user/userdata.pinned.store';
import { AdminService } from '../../core/admin/admin.service';
import { WebpageInfoService } from '../../core/webpage-info/webpage-info.service';
import { StackoverflowHelper } from '../../core/helper/stackoverflow.helper';
import { Logger } from '../../core/logger.service';
import { ErrorService } from '../../core/error/error.service';
import { DeleteNotificationService } from '../../core/notifications/delete-notification.service';
import { FeatureToggleService } from '../../core/feature-toggle.service';
import { EditorProtectionRegistry } from '../../core/editor-protection/editor-protection.registry';
import {
  createDraftIdentity,
  draftKey,
  DraftResourceType,
  DraftRecord,
  DRAFT_SCHEMA_VERSION,
} from '../../core/model/entry-draft';
import { DraftService } from '../../core/cache/draft.service';

const USER = 'owner';
const SEEDED_ID = 'seeded';
const seededKey = (type: DraftResourceType) =>
  draftKey(createDraftIdentity(USER, type, SEEDED_ID));
/** Newest stored draft of the type that was not seeded by the test. */
const stored = (type: DraftResourceType) => {
  const result = new DraftService().list(USER, type);
  const entry =
    result.status === 'ok'
      ? result.entries.find((e) => e.identity.id !== SEEDED_ID)
      : undefined;
  return entry && 'record' in entry
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (entry.record as DraftRecord<any, any>)
    : null;
};
/** The seeded draft as stored, or null once removed. */
const seeded = (type: DraftResourceType) => {
  const raw = localStorage.getItem(seededKey(type));
  return raw ? JSON.parse(raw) : null;
};
const SEEDED_NOTE = {
  form: {
    title: 'Seeded note',
    reference: '',
    tags: ['seed'],
    content: 'Seeded',
    public: false,
    copyableFields: [],
  },
  options: { collectionIds: [] },
};
const SEEDED_BOOKMARK = {
  form: {
    name: 'Seeded bookmark',
    location: 'https://seed.example',
    tags: ['seed'],
    publishedOn: null,
    sourceCodeURL: '',
    description: '',
    public: false,
    language: null,
    youtubeVideoId: null,
    stackoverflowQuestionId: null,
    copyableFields: [],
  },
  options: { readLater: false, pinned: false, collectionIds: [] },
};

function seed(type: DraftResourceType, snapshot: object) {
  localStorage.setItem(
    seededKey(type),
    JSON.stringify({
      schemaVersion: DRAFT_SCHEMA_VERSION,
      identity: createDraftIdentity(USER, type, SEEDED_ID),
      savedAt: new Date(Date.now() - 60_000).toISOString(),
      ...snapshot,
    })
  );
}

const created = (id: string) =>
  of({ headers: new HttpHeaders({ location: `/api/x/${id}` }) });

describe('Editor draft and unsaved-changes integration (real templates)', () => {
  let createNote: ReturnType<typeof vi.fn>;
  let updateNote: ReturnType<typeof vi.fn>;
  let createBookmark: ReturnType<typeof vi.fn>;
  let updateBookmark: ReturnType<typeof vi.fn>;
  let scraping$: Subject<unknown>;
  let fixtures: ComponentFixture<unknown>[];

  beforeEach(async () => {
    sessionStorage.clear();
    localStorage.clear();
    fixtures = [];
    scraping$ = new Subject();
    createNote = vi.fn().mockReturnValue(created('new-note'));
    updateNote = vi.fn().mockReturnValue(of({}));
    createBookmark = vi.fn().mockReturnValue(created('new-bookmark'));
    updateBookmark = vi.fn().mockReturnValue(of({}));
    await TestBed.configureTestingModule({
      imports: [NoteEditorComponent, SaveBookmarkFormComponent],
      providers: [
        provideZoneChangeDetection(),
        provideRouter([]),
        provideNoopAnimations(),
        DatePipe,
        { provide: MatDialog, useValue: { open: vi.fn() } },
        {
          provide: UserInfoStore,
          useValue: {
            getUserId$: () => of(USER),
            getUserInfoOidc$: () => of({ sub: USER }),
          },
        },
        {
          provide: UserDataStore,
          useValue: {
            getUserData$: () => of({ profile: { displayName: 'Owner' } }),
            updateUserDataHistory$: () => EMPTY,
            updateHistoryReadLaterAndPinned$: () => EMPTY,
          },
        },
        {
          provide: SuggestedTagsStore,
          useValue: { getSuggestedBookmarkTags$: () => of([]) },
        },
        {
          provide: PersonalNotesService,
          useValue: {
            getSuggestedNoteTags: () => of([]),
            createNote,
            updateNote,
          },
        },
        {
          provide: PersonalBookmarksService,
          useValue: {
            createBookmark,
            updateBookmark,
            getPersonalBookmarkByLocation: () => of([]),
          },
        },
        {
          provide: WebpageInfoService,
          useValue: { getScrapingData: () => scraping$ },
        },
        {
          provide: StackoverflowHelper,
          useValue: { getStackoverflowQuestionIdFromUrl: () => null },
        },
        { provide: MyBookmarksStore, useValue: { addToLastCreated: vi.fn() } },
        {
          provide: MarkdownService,
          useValue: { toHtml: (value: string) => value },
        },
        {
          provide: AuthenticationService,
          useValue: { isUserInRole: () => false },
        },
        {
          provide: FeatureToggleService,
          useValue: { isAiNoteRefineEnabled: () => of(false) },
        },
        ...[
          UserDataService,
          AdminService,
          UserDataHistoryStore,
          UserDataReadLaterStore,
          UserDataPinnedStore,
          Logger,
          ErrorService,
          DeleteNotificationService,
          PersonalCollectionsService,
          PublicBookmarksService,
          PublicBookmarksStore,
        ].map((provide) => ({ provide, useValue: {} })),
      ],
    }).compileComponents();
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    fixtures.forEach((fixture) => fixture.destroy());
    // Drafts are the only localStorage entries the editors write.
    const keys = Object.keys(localStorage);
    expect(keys.every((k) => k.startsWith('codever-draft:'))).toBe(true);
    localStorage.clear();
    expect(sessionStorage.length).toBe(0);
  });

  const registry = () => TestBed.inject(EditorProtectionRegistry);

  function mount<T>(
    component: new (...args: never[]) => T,
    inputs: Record<string, unknown>
  ): ComponentFixture<T> {
    const fixture = TestBed.createComponent(component);
    Object.entries(inputs).forEach(([name, value]) =>
      fixture.componentRef.setInput(name, value)
    );
    fixture.detectChanges();
    fixtures.push(fixture as ComponentFixture<unknown>);
    return fixture;
  }

  function leave(fixture: ComponentFixture<unknown>) {
    fixture.destroy();
    fixtures = fixtures.filter((f) => f !== fixture);
  }

  function text(fixture: ComponentFixture<unknown>): string {
    fixture.detectChanges();
    return fixture.nativeElement.textContent;
  }

  /**
   * Clicks the editor's Cancel button with the discard dialog answering
   * `answer`; returns the dialog and Location.back spies.
   */
  function clickCancel(fixture: ComponentFixture<unknown>, answer?: string) {
    const open = TestBed.inject(MatDialog).open as ReturnType<typeof vi.fn>;
    open.mockReturnValue({ afterClosed: () => of(answer) });
    const back = vi
      .spyOn(TestBed.inject(Location), 'back')
      .mockImplementation(() => undefined);
    fixture.detectChanges();
    const button = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button')
    ).find((b) => b.textContent?.trim().startsWith('Cancel')) as HTMLElement;
    button.click();
    return { open, back };
  }

  describe('note editor', () => {
    const blankNote = () => mount(NoteEditorComponent, { draftEligible: true });

    it('drafts a blank create, flushes on teardown and restores it', () => {
      const first = blankNote();
      const editor = first.componentInstance;
      expect(registry().hasUnprotectedChanges()).toBe(false);
      editor.noteForm.patchValue({ title: 'Draft title', content: 'Body' });
      editor.tags.push(editor['formBuilder'].control('draft-tag'));
      expect(registry().isArmed()).toBe(true);
      leave(first);
      expect(stored('note').form).toMatchObject({
        title: 'Draft title',
        content: 'Body',
        tags: ['draft-tag'],
      });

      const second = blankNote();
      expect(text(second)).toContain('Draft title');
      expect(text(second)).toContain('Restore');
      expect(second.componentInstance.noteForm.value.title).toBe('');
      const [offer] = second.componentInstance.protection.offers();
      second.componentInstance.protection.restore(offer.id);
      expect(second.componentInstance.noteForm.value).toMatchObject({
        title: 'Draft title',
        content: 'Body',
      });
      expect(second.componentInstance.tags.value).toEqual(['draft-tag']);
      expect(registry().hasUnprotectedChanges()).toBe(false);
      expect(registry().isArmed()).toBe(true);
    });

    it('removes the draft on create success before secondary effects', () => {
      const fixture = blankNote();
      const editor = fixture.componentInstance;
      editor.noteForm.patchValue({ title: 'Saved note' });
      editor.protection.flush();
      expect(stored('note')).not.toBeNull();
      editor.createNote(editor.noteForm.value);
      expect(stored('note')).toBeNull();
      expect(registry().isArmed()).toBe(false);
      leave(fixture);
      expect(stored('note')).toBeNull();
    });

    it('keeps the draft while create has not succeeded', () => {
      createNote.mockReturnValue(NEVER);
      const fixture = blankNote();
      const editor = fixture.componentInstance;
      editor.noteForm.patchValue({ title: 'Unsaved' });
      editor.protection.flush();
      editor.createNote(editor.noteForm.value);
      expect(stored('note').form.title).toBe('Unsaved');
      expect(registry().isArmed()).toBe(true);
    });

    it('Cancel on an untouched create leaves without asking', () => {
      const { open, back } = clickCancel(blankNote());
      expect(open).not.toHaveBeenCalled();
      expect(back).toHaveBeenCalled();
    });

    it('Cancel with Discard removes only its own draft and leaves', () => {
      seed('note', SEEDED_NOTE);
      const fixture = blankNote();
      const editor = fixture.componentInstance;
      editor.noteForm.patchValue({ title: 'Cancelled' });
      editor.protection.flush();
      expect(stored('note').form.title).toBe('Cancelled');
      const { open, back } = clickCancel(fixture, 'discard');
      expect(open).toHaveBeenCalled();
      expect(back).toHaveBeenCalled();
      expect(stored('note')).toBeNull();
      expect(seeded('note')).toMatchObject(SEEDED_NOTE);
      expect(registry().hasUnprotectedChanges()).toBe(false);
      leave(fixture);
      expect(stored('note')).toBeNull();
    });

    it('Cancel with Keep editing stays and keeps the draft', () => {
      const fixture = blankNote();
      fixture.componentInstance.noteForm.patchValue({ title: 'Kept' });
      const { back } = clickCancel(fixture, 'keep');
      expect(back).not.toHaveBeenCalled();
      leave(fixture);
      expect(stored('note').form.title).toBe('Kept');
    });

    it('Cancel on an edit defers to the leave guard', () => {
      const fixture = mount(NoteEditorComponent, { draftEligible: false });
      fixture.componentInstance.noteForm.patchValue({ title: 'Edited' });
      fixture.componentInstance.protection.notifyChange();
      const { open, back } = clickCancel(fixture);
      expect(open).not.toHaveBeenCalled();
      expect(back).toHaveBeenCalled();
      expect(registry().hasUnprotectedChanges()).toBe(true);
    });

    it('never drafts prefilled creates and preserves a seeded draft', () => {
      seed('note', SEEDED_NOTE);
      const fixture = mount(NoteEditorComponent, {
        draftEligible: false,
        title: 'From extension',
      });
      const editor = fixture.componentInstance;
      expect(text(fixture)).not.toContain('Seeded note');
      expect(registry().hasUnprotectedChanges()).toBe(false);
      editor.noteForm.patchValue({ title: '' });
      expect(registry().hasUnprotectedChanges()).toBe(true);
      leave(fixture);
      expect(seeded('note')).toMatchObject(SEEDED_NOTE);
      expect(stored('note')).toBeNull();
    });

    for (const flow of ['isEditMode', 'cloneNote', 'copyToMine'] as const) {
      it(`${flow}: untouched is clean, changes prompt, seeded draft kept`, () => {
        seed('note', SEEDED_NOTE);
        const fixture = mount(NoteEditorComponent, {
          draftEligible: true,
          [flow]: true,
          note: {
            _id: 'n1',
            userId: USER,
            title: 'Existing',
            content: 'Saved',
            tags: ['saved'],
            public: false,
          },
        });
        const editor = fixture.componentInstance;
        expect(text(fixture)).not.toContain('Seeded note');
        expect(registry().hasUnprotectedChanges()).toBe(false);
        expect(editor.protection.isArmed()).toBe(false);
        editor.noteForm.patchValue({ content: 'Changed' });
        expect(registry().hasUnprotectedChanges()).toBe(true);
        editor.protection.flush();
        if (flow === 'isEditMode') {
          editor.updateNote(editor.noteForm.value);
        } else {
          editor.cloneNoteFunction(editor.noteForm.value);
        }
        expect(editor.protection.isArmed()).toBe(false);
        // Stored drafts never arm the close-tab prompt by themselves.
        expect(registry().isArmed()).toBe(false);
        leave(fixture);
        expect(seeded('note')).toMatchObject(SEEDED_NOTE);
        expect(stored('note')).toBeNull();
      });
    }

    it('suspends drafting for notebooks and keeps the Markdown draft', () => {
      const fixture = blankNote();
      const editor = fixture.componentInstance;
      editor.noteForm.patchValue({ title: 'Markdown' });
      editor.protection.flush();
      editor.protection.suspendDrafting();
      editor.isNotebookMode = true;
      editor.notebookRawJson = '{"cells":[]}';
      editor.noteForm.patchValue({ title: 'Notebook' });
      expect(registry().hasUnprotectedChanges()).toBe(true);
      leave(fixture);
      expect(stored('note').form.title).toBe('Markdown');
    });

    it('leaves the bookmark slot alone', () => {
      seed('bookmark', SEEDED_BOOKMARK);
      const fixture = blankNote();
      fixture.componentInstance.noteForm.patchValue({ title: 'Note' });
      fixture.componentInstance.createNote(
        fixture.componentInstance.noteForm.value
      );
      expect(seeded('bookmark')).toMatchObject(SEEDED_BOOKMARK);
    });
  });

  describe('bookmark editor', () => {
    const blankBookmark = () =>
      mount(SaveBookmarkFormComponent, { draftEligible: true });

    it('drafts raw values incl. options and restores them', () => {
      const first = blankBookmark();
      const editor = first.componentInstance;
      editor.bookmarkForm.patchValue({
        name: 'Half done',
        readLater: true,
        pinned: true,
        publishedOn: '2026-02-03',
      });
      editor.selectedCollectionIds = ['c1'];
      editor.protection.notifyChange();
      leave(first);
      expect(stored('bookmark')).toMatchObject({
        form: { name: 'Half done', location: '', publishedOn: '2026-02-03' },
        options: { readLater: true, pinned: true, collectionIds: ['c1'] },
      });

      const second = blankBookmark();
      expect(text(second)).toContain('Half done');
      const [offer] = second.componentInstance.protection.offers();
      second.componentInstance.protection.restore(offer.id);
      const restored = second.componentInstance;
      expect(restored.bookmarkForm.getRawValue()).toMatchObject({
        name: 'Half done',
        readLater: true,
        pinned: true,
      });
      expect(restored.selectedCollectionIds).toEqual(['c1']);
      // incomplete input keeps the same validation result
      expect(restored.bookmarkForm.valid).toBe(false);
    });

    it('removes the draft on create success, before store side effects', () => {
      const fixture = blankBookmark();
      const editor = fixture.componentInstance;
      editor.bookmarkForm.patchValue({
        name: 'Saved',
        location: 'https://saved.example',
      });
      editor.tags.push(editor['formBuilder'].control('tag'));
      editor.protection.flush();
      expect(stored('bookmark')).not.toBeNull();
      editor.saveBookmark(editor.bookmarkForm.value);
      expect(createBookmark).toHaveBeenCalled();
      expect(stored('bookmark')).toBeNull();
      expect(registry().isArmed()).toBe(false);
    });

    it('Cancel with Discard removes the bookmark draft and leaves', () => {
      const fixture = blankBookmark();
      fixture.componentInstance.bookmarkForm.patchValue({ name: 'Dropped' });
      fixture.componentInstance.protection.flush();
      expect(stored('bookmark')).not.toBeNull();
      const { open, back } = clickCancel(fixture, 'discard');
      expect(open).toHaveBeenCalled();
      expect(back).toHaveBeenCalled();
      expect(stored('bookmark')).toBeNull();
    });

    it('keeps an unresolved offer when saving without restoring', () => {
      seed('bookmark', SEEDED_BOOKMARK);
      const fixture = blankBookmark();
      const editor = fixture.componentInstance;
      editor.bookmarkForm.patchValue({
        name: 'Other',
        location: 'https://other.example',
      });
      editor.tags.push(editor['formBuilder'].control('tag'));
      editor.saveBookmark(editor.bookmarkForm.value);
      expect(seeded('bookmark')).toMatchObject(SEEDED_BOOKMARK);
      expect(stored('bookmark')).toBeNull();
    });

    it('keeps an untouched prefilled capture clean across delayed metadata', () => {
      seed('bookmark', SEEDED_BOOKMARK);
      const fixture = mount(SaveBookmarkFormComponent, {
        draftEligible: false,
        url: 'https://captured.example',
      });
      const editor = fixture.componentInstance;
      scraping$.next({ title: 'Scraped title', metaDescription: 'Meta' });
      expect(editor.bookmarkForm.value.name).toBe('Scraped title');
      expect(registry().hasUnprotectedChanges()).toBe(false);
      expect(editor.protection.isArmed()).toBe(false);
      editor.bookmarkForm.patchValue({ location: '' });
      expect(registry().hasUnprotectedChanges()).toBe(true);
      leave(fixture);
      expect(seeded('bookmark')).toMatchObject(SEEDED_BOOKMARK);
      expect(stored('bookmark')).toBeNull();
    });

    it('treats metadata arriving after a user edit as a change', () => {
      const fixture = mount(SaveBookmarkFormComponent, {
        draftEligible: false,
        url: 'https://captured.example',
      });
      fixture.componentInstance.bookmarkForm.patchValue({ name: 'Mine' });
      scraping$.next({ metaDescription: 'Late' });
      expect(registry().hasUnprotectedChanges()).toBe(true);
    });

    it('ignores in-flight scraping responses after restore', () => {
      seed('bookmark', SEEDED_BOOKMARK);
      const fixture = blankBookmark();
      const editor = fixture.componentInstance;
      editor['getWebPageInfo']('https://typed.example');
      editor.protection.restore(SEEDED_ID);
      scraping$.next({ title: 'Stale', metaDescription: 'Stale' });
      expect(editor.bookmarkForm.value.name).toBe('Seeded bookmark');
      expect(registry().hasUnprotectedChanges()).toBe(false);
    });

    for (const flow of ['isUpdate', 'cloneBookmark', 'copyToMine'] as const) {
      it(`${flow}: untouched is clean, changes prompt, seeded draft kept`, () => {
        seed('bookmark', SEEDED_BOOKMARK);
        const fixture = mount(SaveBookmarkFormComponent, {
          draftEligible: true,
          [flow]: true,
          bookmark$: of({
            _id: 'b1',
            userId: USER,
            name: 'Existing',
            location: 'https://existing.example',
            tags: ['saved'],
            public: false,
          }),
        });
        const editor = fixture.componentInstance;
        expect(text(fixture)).not.toContain('Seeded bookmark');
        expect(registry().hasUnprotectedChanges()).toBe(false);
        editor.bookmarkForm.patchValue({ description: 'Changed' });
        expect(registry().hasUnprotectedChanges()).toBe(true);
        leave(fixture);
        expect(seeded('bookmark')).toMatchObject(SEEDED_BOOKMARK);
        expect(stored('bookmark')).toBeNull();
      });
    }

    it('disarms after a successful update; stays armed after a failure', () => {
      const bookmark$ = of({
        _id: 'b1',
        userId: USER,
        name: 'Existing',
        location: 'https://existing.example',
        tags: ['saved'],
        public: false,
      });
      updateBookmark.mockReturnValue(new Observable((s) => s.error({})));
      const failing = mount(SaveBookmarkFormComponent, {
        isUpdate: true,
        bookmark$,
      });
      failing.componentInstance.bookmarkForm.patchValue({ name: 'Changed' });
      failing.componentInstance.saveBookmark(
        failing.componentInstance.bookmarkForm.value
      );
      expect(registry().hasUnprotectedChanges()).toBe(true);
      leave(failing);

      updateBookmark.mockReturnValue(of({}));
      const ok = mount(SaveBookmarkFormComponent, {
        isUpdate: true,
        bookmark$,
      });
      ok.componentInstance.bookmarkForm.patchValue({ name: 'Changed' });
      ok.componentInstance.saveBookmark(ok.componentInstance.bookmarkForm.value);
      expect(registry().isArmed()).toBe(false);
    });

    it('leaves the note slot alone', () => {
      seed('note', SEEDED_NOTE);
      const fixture = blankBookmark();
      fixture.componentInstance.bookmarkForm.patchValue({ name: 'B' });
      leave(fixture);
      expect(seeded('note')).toMatchObject(SEEDED_NOTE);
      expect(stored('note')).toBeNull();
      expect(stored('bookmark').form.name).toBe('B');
    });
  });
});
