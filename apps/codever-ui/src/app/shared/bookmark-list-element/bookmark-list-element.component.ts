import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Bookmark } from '../../core/model/bookmark';
import { PlayYoutubeVideoDialogComponent } from '../dialog/play-youtube-video-dialog/play-youtube-video-dialog.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { KeycloakService } from 'keycloak-angular';
import { UserInfoStore } from '../../core/user/user-info.store';
import { Observable, Subscription } from 'rxjs';
import { UserData } from '../../core/model/user-data';
import { UserDataHistoryStore } from '../../core/user/userdata.history.store';
import { PersonalBookmarksService } from '../../core/personal-bookmarks.service';
import { LoginRequiredDialogComponent } from '../dialog/login-required-dialog/login-required-dialog.component';
import { UserDataPinnedStore } from '../../core/user/userdata.pinned.store';
import { UserDataReadLaterStore } from '../../core/user/userdata.readlater.store';
import { UserDataStore } from '../../core/user/userdata.store';
import { TagFollowingBaseComponent } from '../tag-following-base-component/tag-following-base.component';
import { UserDataWatchedTagsStore } from '../../core/user/userdata.watched-tags.store';
import { DeleteResourceDialogComponent } from '../dialog/delete-bookmark-dialog/delete-resource-dialog.component';
import { SocialShareDialogComponent } from '../dialog/social-share-dialog/social-share-dialog.component';
import { PublicBookmarksStore } from '../../public/bookmarks/store/public-bookmarks-store.service';
import { AdminService } from '../../core/admin/admin.service';
import { FeedStore } from '../../core/user/feed-store.service';
import { MyBookmarksStore } from '../../core/user/my-bookmarks.store';
import { NavigationEnd, Router } from '@angular/router';
import { LoginDialogHelperService } from '../../core/login-dialog-helper.service';
import { AddToHistoryService } from '../../core/user/add-to-history.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { ScrollStrategy, ScrollStrategyOptions } from '@angular/cdk/overlay';
import { DeleteNotificationService } from '../../core/notifications/delete-notification.service';

@Component({
  selector: 'app-bookmark-list-element',
  templateUrl: './bookmark-list-element.component.html',
  styleUrls: ['./bookmark-list-element.component.scss'],
})
export class BookmarkListElementComponent
  extends TagFollowingBaseComponent
  implements OnInit, OnDestroy
{
  @Input()
  bookmark: Bookmark;

  @Input()
  queryText: string; // used for highlighting search terms in the bookmarks list

  @Input()
  userData$: Observable<UserData>;

  @Output()
  bookmarkDeleted = new EventEmitter<boolean>();

  public innerWidth: any;

  userId: string;
  userIsLoggedIn = false;

  @Input()
  isDetailsPage = false;

  @Input()
  isSearchResultsPage = false;

  @Input()
  showMoreText = false;

  @Input()
  filterText = '';

  private navigationSubscription: Subscription;

  copyLinkButtonText = '';

  scrollStrategy: ScrollStrategy;

  constructor(
    private router: Router,
    private playYoutubeDialog: MatDialog,
    public loginDialog: MatDialog,
    private deleteDialog: MatDialog,
    private shareDialog: MatDialog,
    public keycloakService: KeycloakService,
    private userInfoStore: UserInfoStore,
    private userDataHistoryStore: UserDataHistoryStore,
    private personalBookmarksService: PersonalBookmarksService,
    private userDataPinnedStore: UserDataPinnedStore,
    private userDataReadLaterStore: UserDataReadLaterStore,
    private userDataStore: UserDataStore,
    public userDataWatchedTagsStore: UserDataWatchedTagsStore,
    private publicBookmarksStore: PublicBookmarksStore,
    private adminService: AdminService,
    private feedStore: FeedStore,
    private loginDialogHelperService: LoginDialogHelperService,
    private myBookmarksStore: MyBookmarksStore,
    public addToHistoryService: AddToHistoryService,
    private clipboard: Clipboard,
    private readonly scrollStrategyOptions: ScrollStrategyOptions,
    private deleteNotificationService: DeleteNotificationService
  ) {
    super(loginDialog, userDataWatchedTagsStore);

    // START force reload on same root - solution taken from https://github.com/angular/angular/issues/13831
    this.router.routeReuseStrategy.shouldReuseRoute = function () {
      return false;
    };

    this.navigationSubscription = this.router.events.subscribe((evt) => {
      if (evt instanceof NavigationEnd) {
        // trick the Router into believing it's last link wasn't previously loaded
        this.router.navigated = false;
        // if you need to scroll back to top, here is the right place
        window.scrollTo(0, 0);
      }
    });
    // END force reload on same root - solution taken from https://github.com/angular/angular/issues/13831
    // apparently still an issue around the topic - need to keep an eye on it - https://github.com/angular/angular/issues/21115

    this.scrollStrategy = this.scrollStrategyOptions.noop();
  }

  ngOnInit(): void {
    this.innerWidth = window.innerWidth;
    this.keycloakService.isLoggedIn().then((isLoggedIn) => {
      if (isLoggedIn) {
        this.userIsLoggedIn = true;
        this.userInfoStore.getUserInfoOidc$().subscribe((userInfo) => {
          this.userId = userInfo.sub;
        });
      }
    });
  }

  playYoutubeVideo(bookmark: Bookmark) {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = true;

    let relativeWidth = (this.innerWidth * 70) / 100; // take up to 80% of the screen size
    if (this.innerWidth > 1500) {
      relativeWidth = (1500 * 70) / 100;
    } else {
      relativeWidth = (this.innerWidth * 70) / 100;
    }

    const relativeHeight = (relativeWidth * 9) / 16 + 120; // 16:9 to which we add 120 px for the dialog action buttons ("close")
    dialogConfig.width = relativeWidth + 'px';
    dialogConfig.height = relativeHeight + 'px';
    dialogConfig.scrollStrategy = this.scrollStrategy;

    dialogConfig.data = {
      bookmark: bookmark,
    };

    const dialogRef = this.playYoutubeDialog.open(
      PlayYoutubeVideoDialogComponent,
      dialogConfig
    );
  }

  addToPinned(bookmark: Bookmark) {
    if (!this.userIsLoggedIn) {
      const dialogConfig = this.loginDialogHelperService.loginDialogConfig(
        'You need to be logged in to pin bookmarks'
      );
      this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    } else {
      this.userDataPinnedStore.addToPinnedBookmarks(bookmark);
    }
  }

  removeFromPinned(bookmark: Bookmark) {
    this.userDataPinnedStore.removeFromPinnedBookmarks(bookmark);
  }

  addToReadLater(bookmark: Bookmark) {
    if (!this.userIsLoggedIn) {
      const dialogConfig = this.loginDialogHelperService.loginDialogConfig(
        'You need to be logged in to add bookmarks to "Read Later"'
      );
      this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    } else {
      this.userDataReadLaterStore.addToReadLater(bookmark);
    }
  }

  removeFromReadLater(bookmark: Bookmark) {
    this.userDataReadLaterStore.removeFromReadLater(bookmark);
  }

  likeBookmark(bookmark: Bookmark): void {
    if (!this.userIsLoggedIn) {
      const dialogConfig = this.loginDialogHelperService.loginDialogConfig(
        'You need to be logged in to like public bookmarks'
      );
      this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    } else {
      this.userDataStore.likeBookmark(bookmark);
    }
  }

  unLikeBookmark(bookmark: Bookmark): void {
    this.userDataStore.unLikeBookmark(bookmark);
  }

  openDeleteDialog(bookmark: Bookmark) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.scrollStrategy = this.scrollStrategy;
    dialogConfig.data = {
      resourceName: bookmark.name,
      type: 'bookmark',
      isPublic: bookmark.public,
    };

    const dialogRef = this.deleteDialog.open(
      DeleteResourceDialogComponent,
      dialogConfig
    );
    dialogRef.afterClosed().subscribe((data) => {
      console.log('Dialog output:', data);
      if (data === 'DELETE_CONFIRMED') {
        this.deleteBookmark(bookmark);
      }
    });
  }

  deleteBookmark(bookmark: Bookmark): void {
    const deleteAsAdmin =
      this.keycloakService.isUserInRole('ROLE_ADMIN') &&
      bookmark.userId !== this.userId;
    if (deleteAsAdmin) {
      this.adminService.deleteBookmark(bookmark).subscribe(
        () => {
          this.bookmarkDeleted.emit(true);
          this.publicBookmarksStore.removeBookmarkFromPublicStore(bookmark);
          this.feedStore.removeFromFeedBookmarks(bookmark);
          if (this.isSearchResultsPage) {
            location.reload();
          }
          this.deleteNotificationService.showSuccessNotification(
            `Bookmark "${bookmark.name}" was deleted`
          );
        },
        () => {
          this.deleteNotificationService.showErrorNotification(
            `Bookmark "${bookmark.name}" could not be deleted`
          );
        }
      );
    } else {
      this.personalBookmarksService.deleteBookmark(bookmark).subscribe(
        () => {
          if (this.isSearchResultsPage) {
            location.reload();
          } else {
            this.bookmarkDeleted.emit(true);
            this.publicBookmarksStore.removeBookmarkFromPublicStore(bookmark);
            this.userDataStore.removeFromStoresAtDeletion(bookmark);
            this.myBookmarksStore.removeFromStoresAtDeletion(bookmark);
            this.feedStore.removeFromFeedBookmarks(bookmark);
            if (this.isDetailsPage) {
              this.navigateToHomePage();
            }
          }
          this.deleteNotificationService.showSuccessNotification(
            `Bookmark "${bookmark.name}" was deleted`
          );
        },
        () => {
          this.deleteNotificationService.showErrorNotification(
            `Bookmark "${bookmark.name}" could not be deleted`
          );
        }
      );
    }
  }

  navigateToHomePage(): void {
    this.router.navigate(['/']);
  }

  shareBookmarkDialog(bookmark: Bookmark) {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.minWidth = 380;
    dialogConfig.scrollStrategy = this.scrollStrategy;
    dialogConfig.data = {
      bookmark: bookmark,
      userIsLoggedIn: this.userIsLoggedIn,
      userOwnsBookmark: this.bookmark.userId === this.userId,
      userId: this.userId,
    };

    this.shareDialog.open(SocialShareDialogComponent, dialogConfig);
  }

  editBookmark(bookmark: Bookmark): void {
    const link = [`./my-bookmarks/${bookmark._id}/edit`];
    this.router.navigate(link, { state: { bookmark: bookmark } });
  }

  copyToMine(bookmark: Bookmark): void {
    if (!this.userIsLoggedIn) {
      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
      dialogConfig.data = {
        message: 'You need to be logged in to copy it to your personal list',
      };

      const dialogRef = this.loginDialog.open(
        LoginRequiredDialogComponent,
        dialogConfig
      );
    } else {
      const link = [`./my-bookmarks/${bookmark._id}/copy-to-mine`];
      this.router.navigate(link, { state: { bookmark: bookmark } });
    }
  }

  cloneBookmark(bookmark: Bookmark): void {
    const link = [`./my-bookmarks/${bookmark._id}/clone`];
    this.router.navigate(link, { state: { bookmark: bookmark } });
  }

  ngOnDestroy(): void {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  copyToClipboard(location: string) {
    const copied = this.clipboard.copy(location);
    if (copied) {
      this.copyLinkButtonText = ' Copied';
      setTimeout(() => (this.copyLinkButtonText = ''), 1300);
    }
  }

  addToHistory() {
    this.addToHistoryService.promoteInHistoryIfLoggedIn(
      this.userIsLoggedIn,
      this.bookmark
    );
  }
}
