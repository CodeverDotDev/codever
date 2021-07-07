import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
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
import { DeleteBookmarkDialogComponent } from '../dialog/delete-bookmark-dialog/delete-bookmark-dialog.component';
import { SocialShareDialogComponent } from '../dialog/social-share-dialog/social-share-dialog.component';
import { PublicBookmarksStore } from '../../public/bookmarks/store/public-bookmarks-store.service';
import { AdminService } from '../../core/admin/admin.service';
import { FeedStore } from '../../core/user/feed-store.service';
import { MyBookmarksStore } from '../../core/user/my-bookmarks.store';
import { NavigationEnd, Router } from '@angular/router';
import { LoginDialogHelperService } from '../../core/login-dialog-helper.service';
import { AddToHistoryService } from '../../core/user/add-to-history.service';

@Component({
  selector: 'app-bookmark-list-element',
  templateUrl: './bookmark-list-element.component.html',
  styleUrls: ['./bookmark-list-element.component.scss']
})
export class BookmarkListElementComponent extends TagFollowingBaseComponent implements OnInit, OnDestroy {

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
  filterText = '';

  private navigationSubscription: Subscription;

  constructor(private router: Router,
              private playYoutubeDialog: MatDialog,
              public loginDialog: MatDialog,
              private deleteDialog: MatDialog,
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
              public addToHistoryService: AddToHistoryService) {
    super(loginDialog, userDataWatchedTagsStore);

    // START force reload on same root - solution taken from https://github.com/angular/angular/issues/13831
    this.router.routeReuseStrategy.shouldReuseRoute = function () {
      return false;
    }

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
  }

  ngOnInit(): void {
    this.innerWidth = window.innerWidth;
    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.userIsLoggedIn = true;
        this.userInfoStore.getUserInfo$().subscribe(userInfo => {
          this.userId = userInfo.sub;
        });
      }
    });
  }

  playYoutubeVideo(bookmark: Bookmark) {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = true;

    let relativeWidth = (this.innerWidth * 80) / 100; // take up to 80% of the screen size
    if (this.innerWidth > 1500) {
      relativeWidth = (1500 * 80) / 100;
    } else {
      relativeWidth = (this.innerWidth * 80) / 100;
    }

    const relativeHeight = (relativeWidth * 9) / 16 + 120; // 16:9 to which we add 120 px for the dialog action buttons ("close")
    dialogConfig.width = relativeWidth + 'px';
    dialogConfig.height = relativeHeight + 'px';

    dialogConfig.data = {
      bookmark: bookmark,
    };

    const dialogRef = this.playYoutubeDialog.open(PlayYoutubeVideoDialogComponent, dialogConfig);
  }

  addToPinned(bookmark: Bookmark) {
    if (!this.userIsLoggedIn) {
      const dialogConfig =
        this.loginDialogHelperService.loginDialogConfig('You need to be logged in to pin bookmarks');
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
      const dialogConfig =
        this.loginDialogHelperService.loginDialogConfig('You need to be logged in to add bookmarks to "Read Later"');
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
      const dialogConfig =
        this.loginDialogHelperService.loginDialogConfig('You need to be logged in to like public bookmarks');
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
    dialogConfig.data = {
      bookmark: bookmark,
      userData$: this.userData$
    };

    const dialogRef = this.deleteDialog.open(DeleteBookmarkDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(
      data => {
        console.log('Dialog output:', data);
        if (data === 'DELETE_CONFIRMED') {
          this.deleteBookmark(bookmark);
        }
      }
    );
  }

  deleteBookmark(bookmark: Bookmark): void {
    const deleteAsAdmin = this.keycloakService.isUserInRole('ROLE_ADMIN') && bookmark.userId !== this.userId;
    if (deleteAsAdmin) {
      this.adminService.deleteBookmark(bookmark).subscribe(() => {
        this.bookmarkDeleted.emit(true);
        this.publicBookmarksStore.removeBookmarkFromPublicStore(bookmark);
        this.feedStore.removeFromFeedBookmarks(bookmark);
        if (this.isSearchResultsPage) {
          location.reload();
        }
      });
    } else {
      this.personalBookmarksService.deleteBookmark(bookmark).subscribe(() => {
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
      });
    }
  }

  navigateToHomePage(): void {
    this.router.navigate(['/']);
  }

  shareBookmark(bookmark: Bookmark) {

    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.minWidth = 380;
    dialogConfig.data = {
      bookmark: bookmark,
    };

    const dialogRef = this.deleteDialog.open(SocialShareDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(
      data => {
        if (data === 'DELETE_CONFIRMED') {
        }
      }
    );
  }

  editBookmark(bookmark: Bookmark): void {
    const link = [`./my-bookmarks/${bookmark._id}/edit`];
    this.router.navigate(link, {state: {bookmark: bookmark}});
  }

  copyToMine(bookmark: Bookmark): void {
    if (!this.userIsLoggedIn) {
      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
      dialogConfig.data = {
        message: 'You need to be logged in to copy it to your personal list'
      };

      const dialogRef = this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    } else {
      const link = [`./my-bookmarks/${bookmark._id}/copy-to-mine`];
      this.router.navigate(link, {state: {bookmark: bookmark}});
    }
  }

  ngOnDestroy(): void {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

}
