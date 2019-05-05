import { Component, EventEmitter, Injector, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { Bookmark } from '../core/model/bookmark';
import { Router } from '@angular/router';
import { PersonalBookmarksStore } from '../core/store/personal-bookmarks-store.service';
import { KeycloakService } from 'keycloak-angular';
import { PublicBookmarksStore } from '../public/bookmarks/store/public-bookmarks-store.service';
import { PublicBookmarksService } from '../public/bookmarks/public-bookmarks.service';
import { RateBookmarkRequest, RatingActionType } from '../core/model/rate-bookmark.request';
import { UserData } from '../core/model/user-data';
import { UserDataStore } from '../core/user/userdata.store';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { DeleteBookmarkDialogComponent } from './delete-bookmark-dialog/delete-bookmark-dialog.component';
import { LoginRequiredDialogComponent } from './login-required-dialog/login-required-dialog.component';
import { PersonalBookmarkService } from '../core/personal-bookmark.service';

@Component({
  selector: 'app-async-bookmark-list',
  templateUrl: './async-bookmark-list.component.html',
  styleUrls: ['./async-bookmark-list.component.scss']
})
export class AsyncBookmarkListComponent implements OnInit {

  @Input()
  userId: string;

  @Input()
  bookmarks: Observable<Bookmark[]>;

  @Input()
  queryText: string;

  @Input()
  userData: UserData;

  @Output()
  bookmarkDeleted = new EventEmitter<boolean>();

  private router: Router;
  private personalBookmarksStore: PersonalBookmarksStore;
  private userDataStore: UserDataStore;
  private publicBookmarksStore: PublicBookmarksStore;
  private publicBookmarksService: PublicBookmarksService;
  private personalBookmarksService: PersonalBookmarkService;
  private keycloakService: KeycloakService;

  userIsLoggedIn = false;

  private _shownSize = 0;

  @Input()
  set shownSize(shownSize: number) {
    this._shownSize = shownSize;
  }

  get shownSize(): number {
    return this._shownSize;
  }

  constructor(
    private injector: Injector,
    private deleteDialog: MatDialog,
    private loginDialog: MatDialog,
  ) {
    this.router = <Router>this.injector.get(Router);
    this.publicBookmarksStore = <PublicBookmarksStore>this.injector.get(PublicBookmarksStore);
    this.keycloakService = <KeycloakService>this.injector.get(KeycloakService);
    this.publicBookmarksService = <PublicBookmarksService>this.injector.get(PublicBookmarksService);
    this.personalBookmarksService = <PersonalBookmarkService>this.injector.get(PersonalBookmarkService);

    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.userIsLoggedIn = true;
        this.personalBookmarksStore = <PersonalBookmarksStore>this.injector.get(PersonalBookmarksStore);
        this.userDataStore = <UserDataStore>this.injector.get(UserDataStore);
      }
    });
  }

  ngOnInit(): void {
    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.keycloakService.loadUserProfile().then(keycloakProfile => {
          this.userId = keycloakProfile.id;
        });
      }
    });
  }

  /**
   *
   * @param bookmark
   */
  gotoDetail(bookmark: Bookmark): void {
    const link = ['./personal/bookmarks', bookmark._id];
    this.router.navigate(link);
  }

  starBookmark(bookmark: Bookmark): void {
    if (!this.userIsLoggedIn) {
      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
      dialogConfig.data = {
        message: 'You need to be logged in to star public bookmarks'
      };

      const dialogRef = this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    } else {
      if (this.userId) {// TODO verify why is this condition necessary
        bookmark.stars++;
        this.userData.stars.unshift(bookmark._id);
        const rateBookmarkRequest: RateBookmarkRequest = {
          ratingUserId: this.userId,
          action: RatingActionType.STAR,
          bookmark: bookmark
        }
        this.rateBookmark(rateBookmarkRequest);
      }
    }
  }

  unstarBookmark(bookmark: Bookmark): void {
    if (this.userId) {
      bookmark.stars--;
      this.userData.stars.splice(this.userData.stars.indexOf(bookmark._id), 1);
      const rateBookmarkRequest: RateBookmarkRequest = {
        ratingUserId: this.userId,
        action: RatingActionType.UNSTAR,
        bookmark: bookmark
      }

      this.rateBookmark(rateBookmarkRequest);
    }
  }

  private rateBookmark(rateBookmarkRequest: RateBookmarkRequest) {
    this.userDataStore.updateUserData(this.userData).subscribe(() => {
      if (rateBookmarkRequest.action === RatingActionType.STAR) {
        this.userDataStore.addToStarredBookmarks(rateBookmarkRequest.bookmark);
      } else {
        this.userDataStore.removeFromStarredBookmarks(rateBookmarkRequest.bookmark);
      }
      const isBookmarkCreatedByRatingUser = this.userId === rateBookmarkRequest.bookmark.userId;
      if (isBookmarkCreatedByRatingUser) {
        this.personalBookmarksService.updateBookmark(rateBookmarkRequest.bookmark);
      } else {
        this.publicBookmarksService.rateBookmark(rateBookmarkRequest).subscribe(
          res => {
            this.publicBookmarksStore.updateBookmarkInPublicStore(rateBookmarkRequest.bookmark);
          }
        );
      }
    });
  }

  onBookmarkLinkClick(bookmark: Bookmark) {
    if (this.userIsLoggedIn) {
      this.userDataStore.addToHistory(bookmark);
    }
  }

  addToPinned(bookmark: Bookmark) {
    if (!this.userIsLoggedIn) {
      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
      dialogConfig.data = {
        message: 'You need to be logged in to pin bookmarks'
      };

      const dialogRef = this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    } else {
      this.userDataStore.addToPinnedBookmarks(bookmark);
    }

  }

  removeFromPinned(bookmark: Bookmark) {
    this.userDataStore.removeFromPinnedBookmarks(bookmark);
  }

  addToReadLater(bookmark: Bookmark) {
    if (!this.userIsLoggedIn) {
      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
      dialogConfig.data = {
        message: 'You need to be logged to add bookmarks to "Read Later"'
      };

      const dialogRef = this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    } else {
      this.userData.readLater.push(bookmark._id);
      this.userDataStore.updateUserData(this.userData).subscribe(() => {
        this.userDataStore.addToLaterReads(bookmark);
      });
    }
  }

  removeFromReadLater(bookmark: Bookmark) {
    this.userDataStore.removeFromLaterReads(bookmark);
  }

  openDeleteDialog(bookmark: Bookmark) {

    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      bookmark: bookmark,
      userData: this.userData
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
    this.personalBookmarksService.deleteBookmark(bookmark).subscribe( () => {
      this.bookmarkDeleted.emit(true);
      this.publicBookmarksStore.removeBookmarkFromPublicStore(bookmark);
      this.userDataStore.removeFromCategoriesAtDeletion(bookmark);
    });
  }

}
