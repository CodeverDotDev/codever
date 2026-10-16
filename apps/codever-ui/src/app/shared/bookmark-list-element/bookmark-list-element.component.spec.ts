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

describe('BookmarkListElementComponent', () => {
  let fixture: ComponentFixture<BookmarkListElementComponent>;
  let authService: jasmine.SpyObj<AuthenticationService>;
  let dialog: { open: jasmine.Spy };
  let userDataStore: jasmine.SpyObj<UserDataStore>;
  let bookmark: Bookmark;
  let userData: UserData;

  beforeEach(waitForAsync(() => {
    authService = jasmine.createSpyObj<AuthenticationService>(
      'AuthenticationService',
      ['isLoggedIn', 'isUserInRole']
    );
    authService.isLoggedIn.and.returnValue(true);
    authService.isUserInRole.and.returnValue(false);
    dialog = {
      open: jasmine
        .createSpy('open')
        .and.returnValue({ afterClosed: () => of(null) }),
    };
    userDataStore = jasmine.createSpyObj<UserDataStore>('UserDataStore', [
      'toggleFavorite$',
    ]);
    userDataStore.toggleFavorite$.and.returnValue(of({
      resourceType: 'bookmark',
      resourceId: 'bookmark-1',
      favorite: true,
    }));

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
    authService.isLoggedIn.and.returnValue(false);
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
