import { provideZoneChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { UntypedFormArray, UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatChipInput } from '@angular/material/chips';
import { By } from '@angular/platform-browser';
import { EMPTY, of, Subject } from 'rxjs';
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
import { tagsValidator } from '../directive/tags-validation.directive';
import { MAX_TAGS, RECOMMENDED_AI_TAGS } from './tag-policy';

const tags = (count: number) => Array.from({ length: count }, (_, i) => `tag-${i}`);

describe('Shared tag policy', () => {
  function validate(values: unknown[]) {
    return tagsValidator(new UntypedFormArray(values.map((v) => new UntypedFormControl(v))));
  }

  it('separates the recommendation from the ceiling', () => {
    expect(RECOMMENDED_AI_TAGS).toBe(8);
    expect(MAX_TAGS).toBe(13);
    expect(validate(tags(8))).toBeNull();
    expect(validate(tags(13))).toBeNull();
    expect(validate(tags(14))).toEqual({ tooManyTags: true });
    expect(validate([...tags(13), ' TAG-0 '])).toBeNull();
  });

  it('preserves minimum, blocked-tag and invalid-value rules', () => {
    expect(validate([])).toEqual({ tagsAreRequired: true });
    expect(validate([' Awesome-list '])?.blockedTags).toBeDefined();
    for (const value of ['', ' ', null, 42]) {
      expect(validate([value])).toEqual({ invalidTags: true });
    }
  });
});

for (const kind of ['note', 'bookmark'] as const) {
  describe(`${kind} tag editing (real template)`, () => {
    let fixture: ComponentFixture<NoteEditorComponent | SaveBookmarkFormComponent>;
    let editor: NoteEditorComponent | SaveBookmarkFormComponent;
    let open: jasmine.Spy;
    let accepted$: Subject<unknown>;
    let create: jasmine.Spy;
    let update: jasmine.Spy;

    beforeEach(async () => {
      accepted$ = new Subject();
      open = jasmine.createSpy('open').and.returnValues(
        { afterClosed: () => of({ suggestedTags: [], refinedContent: 'Refined', refinedDescription: 'Refined' }) },
        { afterClosed: () => accepted$ }
      );
      create = jasmine.createSpy('create').and.returnValue(EMPTY);
      update = jasmine.createSpy('update').and.returnValue(EMPTY);
      await TestBed.configureTestingModule({
        imports: [NoteEditorComponent, SaveBookmarkFormComponent],
        providers: [
          provideZoneChangeDetection(), provideRouter([]), provideNoopAnimations(), DatePipe,
          { provide: MatDialog, useValue: { open } },
          { provide: UserInfoStore, useValue: { getUserId$: () => of('owner'), getUserInfoOidc$: () => of({ sub: 'owner' }) } },
          { provide: UserDataStore, useValue: { getUserData$: () => of({ profile: { displayName: 'Owner' } }) } },
          { provide: SuggestedTagsStore, useValue: { getSuggestedBookmarkTags$: () => of([]) } },
          { provide: PersonalNotesService, useValue: { getSuggestedNoteTags: () => of([]), createNote: create, updateNote: update } },
          { provide: PersonalBookmarksService, useValue: { createBookmark: create, updateBookmark: update } },
          { provide: MarkdownService, useValue: { toHtml: (value: string) => value } },
          { provide: AuthenticationService, useValue: { isUserInRole: () => false } },
          { provide: FeatureToggleService, useValue: { isAiNoteRefineEnabled: () => of(true) } },
          ...[UserDataService, MyBookmarksStore, WebpageInfoService, AdminService,
            UserDataHistoryStore, UserDataReadLaterStore, UserDataPinnedStore,
            StackoverflowHelper, Logger, ErrorService, DeleteNotificationService,
            PersonalCollectionsService, PublicBookmarksService, PublicBookmarksStore,
          ].map((provide) => ({ provide, useValue: {} })),
        ],
      }).compileComponents();
      fixture = kind === 'note' ? TestBed.createComponent(NoteEditorComponent) : TestBed.createComponent(SaveBookmarkFormComponent);
      editor = fixture.componentInstance;
      fixture.detectChanges();
      form().patchValue({ title: 'Note', content: 'Markdown', name: 'Bookmark', location: 'https://example.com' }, { emitEvent: false });
      render();
    });

    afterEach(() => fixture.destroy());

    function form() {
      return editor instanceof NoteEditorComponent ? editor.noteForm : editor.bookmarkForm;
    }

    function render() {
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();
    }

    function add(value: string) {
      const input = fixture.debugElement.query(By.directive(MatChipInput));
      input.triggerEventHandler('matChipInputTokenEnd', { input: input.nativeElement, value });
      render();
    }

    function submit() {
      fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit', {});
      render();
    }

    function refine(additions: string[]) {
      const button = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .find((value) => value.textContent.includes('Refine with AI'));
      button.click();
      accepted$.next({ tags: additions });
      render();
    }

    function saveDisabled(): boolean {
      return fixture.nativeElement.querySelector('button[type="submit"]').disabled;
    }

    it('normalizes manual tags, deduplicates, and saves all thirteen', () => {
      tags(13).forEach(add);
      add(' TAG-0 ');
      expect(editor.tags.value).toEqual(tags(13));
      expect(saveDisabled()).toBeFalse();
      submit();
      expect(create).toHaveBeenCalledTimes(1);
      expect(create.calls.mostRecent().args[1].tags).toEqual(tags(13));
    });

    it('shows fourteen tags and blocks both submit and direct update until explicit removal', () => {
      tags(14).forEach(add);
      expect(fixture.nativeElement.querySelectorAll('mat-chip-row').length).toBe(14);
      expect(fixture.nativeElement.textContent).toContain('maximum 13 tags');
      expect(saveDisabled()).toBeTrue();
      submit();
      if (editor instanceof NoteEditorComponent) {
        editor.isEditMode = true;
        editor.saveNote(form().value);
      } else {
        editor.bookmark = form().value;
        editor.bookmark$ = of(form().value);
        editor.isUpdate = true;
        editor.saveBookmark(form().value);
      }
      expect(create).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
      fixture.debugElement.queryAll(By.css('mat-chip-row'))[13].triggerEventHandler('removed', {});
      render();
      expect(editor.tags.value).toEqual(tags(13));
      expect(saveDisabled()).toBeFalse();
      expect(fixture.nativeElement.textContent).not.toContain('maximum 13 tags');
    });

    it('displays required and blocked-tag messages', () => {
      submit();
      expect(fixture.nativeElement.textContent).toMatch(/Tags are\s+required/);
      add(' Awesome-list ');
      expect(fixture.nativeElement.textContent).toContain('awesome-list');
      expect(fixture.nativeElement.textContent).toContain('is blocked');
      expect(saveDisabled()).toBeTrue();
    });

    it('accepts eight plus three tags without truncation or duplicate suggestions', () => {
      tags(8).forEach(add);
      refine([' TAG-0 ', 'new-a', 'new-b', 'new-c', ' NEW-A ']);
      expect(editor.tags.value).toEqual([...tags(8), 'new-a', 'new-b', 'new-c']);
      expect(saveDisabled()).toBeFalse();
    });

    it('leaves twelve plus two accepted tags visible and prevents saving', () => {
      tags(12).forEach(add);
      refine(['new-a', 'new-b']);
      expect(editor.tags.value).toEqual([...tags(12), 'new-a', 'new-b']);
      expect(fixture.nativeElement.querySelectorAll('mat-chip-row').length).toBe(14);
      expect(fixture.nativeElement.textContent).toContain('maximum 13 tags');
      expect(saveDisabled()).toBeTrue();
      submit();
      expect(create).not.toHaveBeenCalled();
    });

    for (const count of [9, 10, 13]) {
      it(`preserves ${count} existing tags and supplies distinct hard/soft prompt limits`, () => {
        tags(count).forEach(add);
        refine([]);
        expect(editor.tags.value).toEqual(tags(count));
        expect(saveDisabled()).toBeFalse();
        const prompt = open.calls.first().args[1].data.defaultPrompt;
        expect(prompt).toContain('at most 8');
        expect(prompt).toContain('hard ceiling is 13');
        expect(prompt).toContain('Do not remove existing tags');
      });
    }
  });
}


