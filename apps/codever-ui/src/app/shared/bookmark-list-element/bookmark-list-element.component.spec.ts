import { Clipboard } from '@angular/cdk/clipboard';
import { provideRouter, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ScrollStrategyOptions } from '@angular/cdk/overlay';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
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
import { DeleteResourceDialogComponent } from '../dialog/delete-bookmark-dialog/delete-resource-dialog.component';

describe('BookmarkListElementComponent', () => {
  let fixture: ComponentFixture<BookmarkListElementComponent>;
  let authService: Mocked<
    Pick<AuthenticationService, 'isLoggedIn' | 'isUserInRole'>
  >;
  let dialog: { open: ReturnType<typeof vi.fn> };
  let deleteDialogResult: string | null;
  let personalBookmarksService: {
    deleteBookmark: ReturnType<typeof vi.fn>;
  };
  let adminService: { deleteBookmark: ReturnType<typeof vi.fn> };
  let deleteNotificationService: {
    showSuccessNotification: ReturnType<typeof vi.fn>;
    showErrorNotification: ReturnType<typeof vi.fn>;
  };
  let publicBookmarksStore: {
    removeBookmarkFromPublicStore: ReturnType<typeof vi.fn>;
  };
  let feedStore: { removeFromFeedBookmarks: ReturnType<typeof vi.fn> };
  let myBookmarksStore: { removeFromStoresAtDeletion: ReturnType<typeof vi.fn> };
  let userDataStore: Mocked<
    Pick<UserDataStore, 'toggleFavorite$' | 'removeFromStoresAtDeletion'>
  >;
  let bookmark: Bookmark;
  let userData: UserData;

  beforeEach(waitForAsync(() => {
    authService = {
      isLoggedIn: vi.fn<AuthenticationService['isLoggedIn']>(),
      isUserInRole: vi.fn<AuthenticationService['isUserInRole']>(),
    };
    authService.isLoggedIn.mockReturnValue(true);
    authService.isUserInRole.mockReturnValue(false);
    deleteDialogResult = null;
    dialog = {
      open: vi
        .fn()
        .mockImplementation(() => ({ afterClosed: () => of(deleteDialogResult) })),
    };
    personalBookmarksService = {
      deleteBookmark: vi.fn().mockReturnValue(of(undefined)),
    };
    adminService = {
      deleteBookmark: vi.fn().mockReturnValue(of(undefined)),
    };
    deleteNotificationService = {
      showSuccessNotification: vi.fn(),
      showErrorNotification: vi.fn(),
    };
    publicBookmarksStore = {
      removeBookmarkFromPublicStore: vi.fn(),
    };
    feedStore = { removeFromFeedBookmarks: vi.fn() };
    myBookmarksStore = { removeFromStoresAtDeletion: vi.fn() };
    userDataStore = {
      toggleFavorite$: vi.fn<UserDataStore['toggleFavorite$']>(),
      removeFromStoresAtDeletion: vi.fn<
        UserDataStore['removeFromStoresAtDeletion']
      >(),
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
        { provide: AdminService, useValue: adminService },
        { provide: PersonalBookmarksService, useValue: personalBookmarksService },
        { provide: DeleteNotificationService, useValue: deleteNotificationService },
        { provide: FeedStore, useValue: feedStore },
        { provide: MyBookmarksStore, useValue: myBookmarksStore },
        { provide: PublicBookmarksStore, useValue: publicBookmarksStore },
        ...[
          AddToHistoryService,
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

  it('requires confirmation before deleting a bookmark', () => {
    const deleteButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('[title="Delete bookmark"]');

    deleteButton.click();

    expect(dialog.open).toHaveBeenCalledWith(
      DeleteResourceDialogComponent,
      expect.any(Object)
    );
    expect(personalBookmarksService.deleteBookmark).not.toHaveBeenCalled();
  });

  it('deletes only after the confirmation dialog is confirmed', () => {
    deleteDialogResult = 'DELETE_CONFIRMED';
    const bookmarkDeleted = vi.fn();
    fixture.componentInstance.bookmarkDeleted.subscribe(bookmarkDeleted);

    const deleteButton: HTMLButtonElement =
      fixture.nativeElement.querySelector('[title="Delete bookmark"]');
    deleteButton.click();

    expect(personalBookmarksService.deleteBookmark).toHaveBeenCalledWith(
      bookmark
    );
    expect(bookmarkDeleted).toHaveBeenCalledWith(bookmark);
    expect(deleteNotificationService.showSuccessNotification).toHaveBeenCalled();
  });

  it('reports a deletion failure without updating local stores', () => {
    personalBookmarksService.deleteBookmark.mockReturnValue(
      throwError(() => new Error('delete failed'))
    );

    fixture.componentInstance.deleteBookmark(bookmark);

    expect(deleteNotificationService.showErrorNotification).toHaveBeenCalledWith(
      'Bookmark "Bookmark" could not be deleted'
    );
    expect(userDataStore.removeFromStoresAtDeletion).not.toHaveBeenCalled();
    expect(publicBookmarksStore.removeBookmarkFromPublicStore).not.toHaveBeenCalled();
  });

  it('navigates home after an owner deletes a bookmark from its details page', () => {
    fixture.componentRef.setInput('isDetailsPage', true);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');

    fixture.componentInstance.deleteBookmark(bookmark);

    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('navigates home after an administrator deletes a bookmark detail', () => {
    authService.isUserInRole.mockReturnValue(true);
    fixture.componentRef.setInput('isDetailsPage', true);
    const otherUsersBookmark = { ...bookmark, userId: 'another-owner' };
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');

    fixture.componentInstance.deleteBookmark(otherUsersBookmark);

    expect(adminService.deleteBookmark).toHaveBeenCalledWith(otherUsersBookmark);
    expect(userDataStore.removeFromStoresAtDeletion).toHaveBeenCalledWith(
      otherUsersBookmark
    );
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('hides the delete action from users who are not owners or admins', () => {
    fixture.componentRef.setInput(
      'userData$',
      of({ ...userData, userId: 'another-user' })
    );
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[title="Delete bookmark"]')
    ).toBeNull();
  });
});
