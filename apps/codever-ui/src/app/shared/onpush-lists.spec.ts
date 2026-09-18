import { Component, provideZoneChangeDetection } from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  flushMicrotasks,
  TestBed,
  tick,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';
import { ScrollStrategyOptions } from '@angular/cdk/overlay';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { AsyncBookmarkListComponent } from './async-bookmark-list/async-bookmark-list.component';
import { AsyncNoteListComponent } from './async-note-list/async-note-list.component';
import { BookmarkListElementComponent } from './bookmark-list-element/bookmark-list-element.component';
import { NoteDetailsComponent } from './note-details/note-details.component';
import { NoteTocComponent } from './note-details/note-toc/note-toc.component';
import { PageNavigationBarComponent } from './page-navigation-bar/page-navigation-bar.component';
import { Bookmark } from '../core/model/bookmark';
import { Note } from '../core/model/note';
import { UserData } from '../core/model/user-data';
import { AuthenticationService } from '../core/auth/authentication.service';
import { UserInfoStore } from '../core/user/user-info.store';
import { UserDataStore } from '../core/user/userdata.store';
import { UserDataHistoryStore } from '../core/user/userdata.history.store';
import { UserDataPinnedStore } from '../core/user/userdata.pinned.store';
import { UserDataReadLaterStore } from '../core/user/userdata.readlater.store';
import { UserDataWatchedTagsStore } from '../core/user/userdata.watched-tags.store';
import { PersonalBookmarksService } from '../core/personal-bookmarks.service';
import { PersonalNotesService } from '../core/personal-notes.service';
import { PublicBookmarksStore } from '../public/bookmarks/store/public-bookmarks-store.service';
import { AdminService } from '../core/admin/admin.service';
import { FeedStore } from '../core/user/feed-store.service';
import { MyBookmarksStore } from '../core/user/my-bookmarks.store';
import { LoginDialogHelperService } from '../core/login-dialog-helper.service';
import { AddToHistoryService } from '../core/user/add-to-history.service';
import { DeleteNotificationService } from '../core/notifications/delete-notification.service';
import { PaginationNotificationService } from '../core/pagination-notification.service';
import { environment } from '../../environments/environment';

function bookmark(id: string, name = id): Bookmark {
  return {
    _id: id,
    name,
    location: 'https://example.com',
    userId: 'owner',
    public: true,
    tags: [],
    likeCount: 0,
  } as Bookmark;
}

function note(id: string, title = id): Note {
  return {
    _id: id,
    title,
    userId: 'owner',
    public: false,
    tags: [],
    content: '# First\n\n# Second',
    contentType: 'markdown',
  } as Note;
}

@Component({
  imports: [
    AsyncBookmarkListComponent,
    AsyncNoteListComponent,
    NoteDetailsComponent,
  ],
  template: `
    <button class="unrelated" (click)="counter = counter + 1">
      {{ counter }}
    </button>
    <app-async-bookmark-list
      [bookmarks$]="bookmarks$"
      [userData$]="userData$"
      [queryText]="queryText"
      [showPagination]="true"
      [currentPage]="1"
    />
    <app-async-note-list
      [notes$]="notes$"
      [queryText]="queryText"
      [showPagination]="false"
    />
    @if (showDetail) {
    <app-note-details [note$]="detail$" />
    }
  `,
})
class ListHostComponent {
  counter = 0;
  queryText = '';
  bookmarks$ = new BehaviorSubject<Bookmark[]>([]);
  notes$ = new BehaviorSubject<Note[]>([]);
  userData$ = new BehaviorSubject<UserData>({
    userId: 'owner',
    pinned: [],
    readLater: [],
    likes: [],
    watchedTags: [],
    ignoredTags: [],
  } as UserData);
  showDetail = false;
  detail$ = of(note('detail'));
}

describe('OnPush lists (real templates beneath a parent view)', () => {
  let fixture: ComponentFixture<ListHostComponent>;
  let host: ListHostComponent;
  let userInfo$: Subject<{ sub: string }>;
  let copy: jasmine.Spy;
  let noteUpdate$: Subject<Note>;

  beforeEach(async () => {
    userInfo$ = new Subject();
    copy = jasmine.createSpy('copy').and.returnValue(true);
    noteUpdate$ = new Subject();
    await TestBed.configureTestingModule({
      imports: [ListHostComponent],
      providers: [
        provideZoneChangeDetection(),
        provideRouter([]),
        { provide: MatDialog, useValue: {} },
        { provide: Clipboard, useValue: { copy } },
        { provide: ScrollStrategyOptions, useValue: { noop: () => ({}) } },
        {
          provide: AuthenticationService,
          useValue: { isLoggedIn: () => true, isUserInRole: () => false },
        },
        {
          provide: UserInfoStore,
          useValue: {
            getUserInfoOidc$: () => userInfo$,
            getUserId$: () => of('owner'),
          },
        },
        {
          provide: UserDataStore,
          useValue: {
            getUserData$: () => host.userData$,
            likeBookmark: (value: Bookmark) => value.likeCount++,
          },
        },
        {
          provide: PersonalNotesService,
          useValue: { updateNote: () => noteUpdate$ },
        },
        ...[
          UserDataHistoryStore,
          UserDataPinnedStore,
          UserDataReadLaterStore,
          UserDataWatchedTagsStore,
          PersonalBookmarksService,
          PublicBookmarksStore,
          AdminService,
          FeedStore,
          MyBookmarksStore,
          LoginDialogHelperService,
          AddToHistoryService,
          DeleteNotificationService,
          PaginationNotificationService,
        ].map((provide) => ({ provide, useValue: {} })),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ListHostComponent);
    host = fixture.componentInstance;
  });

  afterEach(() => fixture.destroy());

  // Check the host, not the child's ChangeDetectorRef: forcing a child check would
  // hide precisely the missing markForCheck regressions these tests protect against.
  function render(): void {
    fixture.detectChanges();
    tick(1200);
    fixture.detectChanges();
  }

  function cards(): HTMLElement[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('app-bookmark-list-element')
    );
  }

  function click(selector: string): void {
    const element = fixture.nativeElement.querySelector(
      selector
    ) as HTMLElement;
    expect(element).withContext(selector).not.toBeNull();
    element.click();
    fixture.detectChanges();
  }

  it('skips unchanged cards on unrelated parent checks and updates replacement inputs', fakeAsync(() => {
    const first = bookmark('one');
    const readName = jasmine.createSpy('readName').and.returnValue('one');
    Object.defineProperty(first, 'name', { get: readName });
    host.bookmarks$.next([first, bookmark('two')]);
    render();
    readName.calls.reset();
    click('.unrelated');
    fixture.detectChanges();
    expect(readName).not.toHaveBeenCalled();

    host.bookmarks$.next([first, bookmark('two', 'Updated two')]);
    fixture.detectChanges();
    expect(cards()[1].textContent).toContain('Updated two');
    expect(readName).not.toHaveBeenCalled();
  }));

  it('renders additions, deletions and replacement list streams', fakeAsync(() => {
    render();
    host.bookmarks$.next([bookmark('one'), bookmark('two')]);
    fixture.detectChanges();
    expect(cards().length).toBe(2);
    host.bookmarks$.next([bookmark('two')]);
    fixture.detectChanges();
    expect(cards().length).toBe(1);
    host.bookmarks$ = new BehaviorSubject([bookmark('three')]);
    fixture.detectChanges();
    expect(cards()[0].textContent).toContain('three');
  }));

  it('keeps filtering and query highlighting responsive', fakeAsync(() => {
    host.bookmarks$.next([
      bookmark('one', 'Angular'),
      bookmark('two', 'MongoDB'),
    ]);
    render();
    const filter = fixture.nativeElement.querySelector(
      'input[type="search"]'
    ) as HTMLInputElement;
    filter.value = 'Angular';
    filter.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(cards().length).toBe(1);
    expect(cards()[0].textContent).toContain('Angular');
    host.queryText = 'Angular';
    fixture.detectChanges();
    const card = fixture.debugElement.query(
      By.directive(BookmarkListElementComponent)
    ).componentInstance;
    expect(card.queryText).toBe('Angular');
  }));

  it('updates pinned, read-later and like state even for same-reference user emissions', fakeAsync(() => {
    const value = bookmark('one');
    host.bookmarks$.next([value]);
    render();
    const data = host.userData$.value;
    data.pinned.push('one');
    data.readLater.push('one');
    data.likes.push('one');
    value.likeCount = 7;
    host.userData$.next(data);
    fixture.detectChanges();
    expect(cards()[0].querySelector('[title="Unpin bookmark"]')).not.toBeNull();
    expect(
      cards()[0].querySelector('[title="Remove from Read later"]')
    ).not.toBeNull();
    expect(cards()[0].querySelector('[title="UnLike"]')).not.toBeNull();
    expect(cards()[0].textContent).toContain('7');
  }));

  it('refreshes a clicked card after a synchronous in-place like mutation', fakeAsync(() => {
    host.bookmarks$.next([bookmark('one')]);
    render();
    click('[title="Like"]');
    expect(host.bookmarks$.value[0].likeCount).toBe(1);
    expect(cards()[0].textContent).toContain('1');
  }));

  it('renders delayed user identity and unsubscribes on destruction', fakeAsync(() => {
    const value = bookmark('one');
    value.tags = ['angular'];
    host.bookmarks$.next([value]);
    render();
    expect(
      cards()[0].querySelector(
        '[title="Go to public bookmarks tagged angular"]'
      )
    ).not.toBeNull();
    userInfo$.next({ sub: 'owner' });
    fixture.detectChanges();
    expect(
      cards()[0].querySelector('[title="Search my bookmarks tagged angular"]')
    ).not.toBeNull();
    fixture.destroy();
    expect(userInfo$.observed).toBeFalse();
  }));

  it('clears copied feedback and restarts its timer on repeated copies', fakeAsync(() => {
    host.bookmarks$.next([bookmark('one')]);
    render();
    click('[title="Copy link to clipboard"]');
    expect(cards()[0].textContent).toContain('Copied');
    tick(1000);
    click('[title="Copy link to clipboard"]');
    tick(300);
    fixture.detectChanges();
    expect(cards()[0].textContent).toContain('Copied');
    tick(1000);
    fixture.detectChanges();
    expect(cards()[0].textContent).not.toContain('Copied');
  }));

  it('does not show feedback when copying fails and cancels timers on destruction', fakeAsync(() => {
    host.bookmarks$.next([bookmark('one')]);
    render();
    copy.and.returnValue(false);
    click('[title="Copy link to clipboard"]');
    expect(cards()[0].textContent).not.toContain('Copied');
    copy.and.returnValue(true);
    click('[title="Copy link to clipboard"]');
    const card = fixture.debugElement.query(
      By.directive(BookmarkListElementComponent)
    ).componentInstance;
    fixture.destroy();
    tick(1400);
    expect(card.copyLinkButtonText).toBe(' Copied');
  }));

  it('renders delayed pagination beneath an otherwise clean OnPush list', fakeAsync(() => {
    host.bookmarks$.next(
      Array.from({ length: environment.PAGINATION_PAGE_SIZE }, (_, i) =>
        bookmark(String(i))
      )
    );
    fixture.detectChanges();
    const pagination = fixture.debugElement.query(
      By.directive(PageNavigationBarComponent)
    ).componentInstance;
    expect(pagination.showPaginationDelayExpired).toBeFalse();
    tick(1000);
    fixture.detectChanges();
    expect(pagination.showPaginationDelayExpired).toBeTrue();
    expect(
      fixture.nativeElement
        .querySelector('app-page-navigation-bar')
        .textContent.trim().length
    ).toBeGreaterThan(0);
  }));

  it('skips the note subtree on unrelated checks and renders list emissions', fakeAsync(() => {
    const value = note('one');
    const readTitle = jasmine
      .createSpy('readTitle')
      .and.returnValue('First note');
    Object.defineProperty(value, 'title', { get: readTitle });
    host.notes$.next([value]);
    render();
    readTitle.calls.reset();
    click('.unrelated');
    fixture.detectChanges();
    expect(readTitle).not.toHaveBeenCalled();
    readTitle.and.returnValue('Changed title');
    host.notes$.next([value]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Changed title');
    const replacement = note('one', 'Updated note');
    host.notes$.next([replacement]);
    render();
    expect(fixture.nativeElement.textContent).toContain('Updated note');
    host.notes$.next([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-note-details')).toBeNull();
  }));

  it('renders note clipboard promise and timer updates and zoom events', fakeAsync(() => {
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
    host.notes$.next([note('one')]);
    render();
    click('[title="Copy markdown content"]');
    flushMicrotasks();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Copied');
    tick(1300);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Copied');
    click('[title="Zoom in"]');
    expect(
      fixture.nativeElement.querySelector('.zoom-indicator').textContent
    ).toContain('110%');
  }));

  it('preserves inline checklist updates and rollback on HTTP failure', fakeAsync(() => {
    const value = note('one');
    value.content = '- [ ] Task';
    host.notes$.next([value]);
    render();
    click('input.note-task-checkbox');
    expect(value.content).toBe('- [x] Task');
    noteUpdate$.error(new Error('Save failed'));
    fixture.detectChanges();
    expect(value.content).toBe('- [ ] Task');
    expect(
      fixture.nativeElement.querySelector('input.note-task-checkbox').checked
    ).toBeFalse();
  }));

  it('preserves delayed headings and scroll-spy changes on the Default note details page', fakeAsync(() => {
    host.showDetail = true;
    fixture.detectChanges();
    const headings = fixture.nativeElement.querySelectorAll('h1');
    spyOn(headings[0], 'getBoundingClientRect').and.returnValue({
      top: 0,
    } as DOMRect);
    const secondPosition = spyOn(
      headings[1],
      'getBoundingClientRect'
    ).and.returnValue({ top: 200 } as DOMRect);
    spyOnProperty(
      document.documentElement,
      'scrollHeight',
      'get'
    ).and.returnValue(10000);
    render();
    // Creating the TOC after the headings render may schedule one more setup.
    tick(100);
    fixture.detectChanges();
    const tocDebug = fixture.debugElement.query(By.directive(NoteTocComponent));
    const toc = tocDebug.componentInstance as NoteTocComponent;
    expect(toc.headings.map((heading) => heading.text)).toContain('Second');
    expect(tocDebug.nativeElement.textContent).toContain('Second');
    expect(toc.activeHeadingId).toBe('first');
    expect(
      tocDebug.nativeElement.querySelector('.toc-active').textContent
    ).toContain('First');
    secondPosition.and.returnValue({ top: 0 } as DOMRect);
    window.dispatchEvent(new Event('scroll'));
    tick(20);
    fixture.detectChanges();
    expect(toc.activeHeadingId).toBe('second');
    expect(
      tocDebug.nativeElement.querySelector('.toc-active').textContent
    ).toContain('Second');
  }));
});
