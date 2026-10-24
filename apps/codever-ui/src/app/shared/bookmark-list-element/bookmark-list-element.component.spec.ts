import { Clipboard } from '@angular/cdk/clipboard';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ScrollStrategyOptions } from '@angular/cdk/overlay';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Bookmark } from '../../core/model/bookmark';
import { UserData } from '../../core/model/user-data';
import { AuthenticationService } from '../../core/auth/authentication.service';
import { AdminService } from '../../core/admin/admin.service';
import { PersonalBookmarksService } from '../../core/personal-bookmarks.service';
import { UserDataService } from '../../core/user-data.service';
import { DeleteNotificationService } from '../../core/notifications/delete-notification.service';
import { FeedStore } from '../../core/user/feed-store.service';
import { MyBookmarksStore } from '../../core/user/my-bookmarks.store';
import { NotifyStoresService } from '../../core/user/notify-stores.service';
import { AddToHistoryService } from '../../core/user/add-to-history.service';
import { UserDataHistoryStore } from '../../core/user/userdata.history.store';
import { UserDataPinnedStore } from '../../core/user/userdata.pinned.store';
import { UserDataReadLaterStore } from '../../core/user/userdata.readlater.store';
import { UserDataStore } from '../../core/user/userdata.store';
import { UserDataWatchedTagsStore } from '../../core/user/userdata.watched-tags.store';
import { LoginDialogHelperService } from '../../core/login-dialog-helper.service';
import { PublicBookmarksStore } from '../../public/bookmarks/store/public-bookmarks-store.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { BookmarkListElementComponent } from './bookmark-list-element.component';
import { describe, expect, it, vi, type Mocked } from 'vitest';

describe('BookmarkListElementComponent', () => {
  let fixture: ComponentFixture<BookmarkListElementComponent>;
  let authService: Mocked<
    Pick<AuthenticationService, 'isLoggedIn' | 'isUserInRole'>
  >;
  let dialog: { open: ReturnType<typeof vi.fn> };
  let userDataStore: Mocked<Pick<UserDataStore, 'toggleFavorite$'>>;
  let bookmark: Bookmark;
  let userData: UserData;

  beforeEach(waitForAsync(() => {
    authService = {
      isLoggedIn: vi.fn<AuthenticationService['isLoggedIn']>(),
      isUserInRole: vi.fn<AuthenticationService['isUserInRole']>(),
    };
    authService.isLoggedIn.mockReturnValue(true);
    authService.isUserInRole.mockReturnValue(false);
    dialog = {
      open: vi.fn().mockReturnValue({ afterClosed: () => of(null) }),
    };
    userDataStore = {
      toggleFavorite$: vi.fn<UserDataStore['toggleFavorite$']>(),
    };
    userDataStore.toggleFavorite$.mockReturnValue(
      of({
        resourceType: 'bookmark',
        resourceId: 'bookmark-1',
        favorite: true,
      })
    );

    TestBed.configureTestingModule({
      imports: [BookmarkListElementComponent],
      providers: [
        provideRouter([]),
        { provide: MatDialog, useValue: dialog },
        { provide: Clipboard, useValue: { copy: () => true } },
        { provide: ScrollStrategyOptions, useValue: { noop: () => ({}) } },
        { provide: AuthenticationService, useValue: authService },
        {
          provide: UserInfoStore,
          useValue: { getUserInfoOidc$: () => of({ sub: 'owner' }) },
        },
        { provide: UserDataStore, useValue: userDataStore },
        ...[
          AdminService,
          AddToHistoryService,
          DeleteNotificationService,
          FeedStore,
          MyBookmarksStore,
          PersonalBookmarksService,
          PublicBookmarksStore,
          UserDataHistoryStore,
          UserDataPinnedStore,
          UserDataReadLaterStore,
          UserDataWatchedTagsStore,
          UserDataService,
          NotifyStoresService,
        ].map((provider) => ({ provide: provider, useValue: {} })),
        {
          provide: LoginDialogHelperService,
          useValue: {
            loginDialogConfig: () => ({ data: {} }),
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    bookmark = {
      _id: 'bookmark-1',
      name: 'Bookmark',
      location: 'https://example.com',
      type: 'bookmark',
      tags: [],
      userDisplayName: 'Owner',
      userId: 'owner',
      public: true,
      likeCount: 0,
    };
    userData = {
      userId: 'owner',
      favorites: ['bookmark-1'],
      favoriteNotes: [],
      likes: [],
      watchedTags: [],
      ignoredTags: [],
      pinned: [],
      readLater: [],
    };
    fixture = TestBed.createComponent(BookmarkListElementComponent);
    fixture.componentRef.setInput('bookmark', bookmark);
    fixture.componentRef.setInput('userData$', of(userData));
    fixture.detectChanges();
  });

  it('shows the active favorite state on a bookmark', () => {
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('.favorite-star-toggle');

    expect(button).toBeTruthy();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.classList).toContain('favorite-star-active');
  });

  it('sends a favorite toggle for a signed-in user', () => {
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('.favorite-star-toggle');
    button.click();

    expect(userDataStore.toggleFavorite$).toHaveBeenCalledWith(
      'bookmark',
      'bookmark-1'
    );
  });

  it('prompts guests to log in without sending a mutation', () => {
    authService.isLoggedIn.mockReturnValue(false);
    fixture.destroy();
    fixture = TestBed.createComponent(BookmarkListElementComponent);
    fixture.componentRef.setInput('bookmark', bookmark);
    fixture.componentRef.setInput('userData$', of(null));
    fixture.detectChanges();

    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('.favorite-star-toggle');
    button.click();

    expect(dialog.open).toHaveBeenCalled();
    expect(userDataStore.toggleFavorite$).not.toHaveBeenCalled();
  });
});
