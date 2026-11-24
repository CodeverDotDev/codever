import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { UNDO_LAST_SAVE_STATE_KEY } from '../../shared/undo-last-save/undo-last-save';
import { EMPTY, of } from 'rxjs';
import { Bookmark } from '../../core/model/bookmark';
import { BookmarkListElementComponent } from '../../shared/bookmark-list-element/bookmark-list-element.component';

import { BookmarkDetailsComponent } from './bookmark-details.component';
import { UserInfoStore } from '../../core/user/user-info.store';
import { UserDataStore } from '../../core/user/userdata.store';
import { PersonalBookmarksService } from '../../core/personal-bookmarks.service';
import { AuthenticationService } from '../../core/auth/authentication.service';
import { MainLinkShortcutService } from '../../core/shortcut/main-link-shortcut.service';

describe('BookmarkDetailsComponent', () => {
  let component: BookmarkDetailsComponent;
  let fixture: ComponentFixture<BookmarkDetailsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BookmarkDetailsComponent],
      providers: [
        provideRouter([]),
        { provide: UserInfoStore, useValue: { getUserInfoOidc$: () => EMPTY } },
        { provide: UserDataStore, useValue: {} },
        { provide: PersonalBookmarksService, useValue: {} },
        { provide: AuthenticationService, useValue: { isLoggedIn: () => false } },
        {
          provide: MainLinkShortcutService,
          useValue: { register: vi.fn(), unregister: vi.fn() },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookmarkDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

@Component({
  selector: 'app-bookmark-list-element',
  template: `<div class="bookmark-stub">{{ bookmark?.description }}</div>
    @if (undoLastSave) {
      <button class="undo-stub" (click)="lastSaveUndone.emit(undoLastSave)"></button>
    }`,
})
class BookmarkListElementStubComponent {
  @Input() bookmark?: Bookmark;
  @Input() userData$: unknown;
  @Input() isDetailsPage = false;
  @Input() showMoreText = false;
  @Input() undoLastSave: Bookmark | null = null;
  @Output() lastSaveUndone = new EventEmitter<Bookmark>();
}

const owned: Bookmark = {
  _id: 'b1',
  name: 'Bookmark',
  location: 'https://example.com',
  description: 'current description',
  tags: [],
  userId: 'owner',
  public: false,
} as Bookmark;
const beforeSave = { ...owned, description: 'description before save' } as Bookmark;

describe('BookmarkDetailsComponent undo last save', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BookmarkDetailsComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'b1' }),
              queryParamMap: convertToParamMap({}),
            },
          },
        },
        {
          provide: UserInfoStore,
          useValue: { getUserInfoOidc$: () => of({ sub: 'owner' }) },
        },
        { provide: UserDataStore, useValue: { getUserData$: () => of(null) } },
        {
          provide: PersonalBookmarksService,
          useValue: { getPersonalBookmarkById: () => of(owned) },
        },
        { provide: AuthenticationService, useValue: { isLoggedIn: () => true } },
        {
          provide: MainLinkShortcutService,
          useValue: { register: vi.fn(), unregister: vi.fn() },
        },
      ],
    });
    TestBed.overrideComponent(BookmarkDetailsComponent, {
      remove: { imports: [BookmarkListElementComponent] },
      add: { imports: [BookmarkListElementStubComponent] },
    });
  });
  afterEach(() => window.history.replaceState({}, ''));

  const undoStub = (fixture: ComponentFixture<BookmarkDetailsComponent>) =>
    fixture.nativeElement.querySelector('.undo-stub') as HTMLButtonElement | null;

  it('offers the undo handed over by the editor and shows the result', () => {
    window.history.replaceState({ [UNDO_LAST_SAVE_STATE_KEY]: beforeSave }, '');
    const fixture = TestBed.createComponent(BookmarkDetailsComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('current description');

    undoStub(fixture)?.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('description before save');
    expect(undoStub(fixture)).toBeNull();
  });

  it('offers no undo when the page was not opened by a save', () => {
    window.history.replaceState({}, '');
    const fixture = TestBed.createComponent(BookmarkDetailsComponent);
    fixture.detectChanges();

    expect(undoStub(fixture)).toBeNull();
  });
});
