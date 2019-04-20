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
    }

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
      const isBookmarkCreatedByRatingUser = this.userId === rateBookmarkRequest.bookmark.userId;
      if (rateBookmarkRequest.action === RatingActionType.STAR) {
        this.userDataStore.addToStarredBookmarks(rateBookmarkRequest.bookmark);
        this.personalBookmarksStore.addToPersonalBookmarksStore(rateBookmarkRequest.bookmark);
      } else {
        this.userDataStore.removeFromStarredBookmarks(rateBookmarkRequest.bookmark);
        this.personalBookmarksStore.removeBookmarkFromPersonalBookmarksStore(rateBookmarkRequest.bookmark);
      }
      if (isBookmarkCreatedByRatingUser) {
        const obs = this.personalBookmarksStore.updateBookmark(rateBookmarkRequest.bookmark);
      } else {
        const obs = this.publicBookmarksService.rateBookmark(rateBookmarkRequest);
        obs.subscribe(
          res => {
            this.publicBookmarksStore.updateBookmarkInPublicStore(rateBookmarkRequest.bookmark);
          }
        );
      }
    });
  }

  onBookmarkLinkClick(bookmark: Bookmark) {
    if (this.userId === bookmark.userId) {
      bookmark.lastAccessedAt = new Date();
      const obs = this.personalBookmarksStore.updateBookmark(bookmark);
    }
  }

  addToReadLater(bookmark: Bookmark) {
    this.userData.readLater.push(bookmark._id);
    this.userDataStore.updateUserData(this.userData).subscribe(() => {
      this.userDataStore.addToLaterReads(bookmark);
    });
  }

  removeFromReadLater(bookmark: Bookmark) {
    this.userData.readLater = this.userData.readLater.filter(x => x !== bookmark._id);
    this.userDataStore.updateUserData(this.userData).subscribe(() => {
      this.userDataStore.removeFromLaterReads(bookmark);
    });
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
    const obs = this.personalBookmarksStore.deleteBookmark(bookmark);
    obs.subscribe(() => {
      this.bookmarkDeleted.emit(true);
      const obs2 = this.publicBookmarksStore.removeBookmarkFromPublicStore(bookmark);
      const obs3 = this.userDataStore.removeFromLaterReads(bookmark);
      const obs4 = this.userDataStore.removeFromStarredBookmarks(bookmark);
    });
  }

}
