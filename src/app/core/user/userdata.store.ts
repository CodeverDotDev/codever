import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';

import { Injectable } from '@angular/core';
import { Logger } from '../logger.service';
import { ErrorService } from '../error/error.service';
import { Router } from '@angular/router';

import { KeycloakService } from 'keycloak-angular';
import { UserData } from '../model/user-data';
import { UserDataService } from '../user-data.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Bookmark } from '../model/bookmark';

@Injectable()
export class UserDataStore {

  private _userData: ReplaySubject<UserData> = new ReplaySubject(1);

  private _laterReads: BehaviorSubject<Bookmark[]> = new BehaviorSubject([]);
  private laterReadsHasBeenRequested = false;

  private _stars: BehaviorSubject<Bookmark[]> = new BehaviorSubject([]);
  private starredBookmarksHasBeenRequested = false;

  private _pinned: BehaviorSubject<Bookmark[]> = new BehaviorSubject([]);
  private pinnedBookmarksHasBeenRequested = false;

  private _history: BehaviorSubject<Bookmark[]> = new BehaviorSubject([]);
  private historyHasBeenRequested = false;

  private _watchedTags: BehaviorSubject<Bookmark[]> = new BehaviorSubject([]);
  private bookmarksForWatchedTagsHasBeenRequested = false;
  private forceReloadOfBookmarksForWatchedTags = false; // modified when the user changes the watched tags

  private userId: string;

  userData: UserData = {searches: []};

  constructor(private userService: UserDataService,
              private logger: Logger,
              private router: Router,
              private errorService: ErrorService,
              private keycloakService: KeycloakService,
  ) {
    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.keycloakService.loadUserProfile().then(keycloakProfile => {
          this.userId = keycloakProfile.id;
          this.loadInitialData(this.userId);
        });
      }
    });
  }

  public loadInitialData(userId: string) {
    this.userService.getUserData(userId).subscribe(data => {
        this.userData = data;
        this.userData.searches = this.userData.searches.sort((a, b) => {
          const result: number = a.lastAccessedAt == null ? (b.lastAccessedAt == null ? 0 : 1)
            : b.lastAccessedAt == null ? -1 : a.lastAccessedAt < b.lastAccessedAt ? 1 : a.lastAccessedAt > b.lastAccessedAt ? -1 : 0;
          return result;
        });

        this._userData.next(this.userData)
      },
      (errorResponse: HttpErrorResponse) => {
        if (errorResponse.status === 404 && errorResponse.error.title === 'User data was not found') {
          const initialUserData: UserData = {
            userId: userId,
            searches: [],
            readLater: [],
            stars: [],
            watchedTags: []
          }

          this.userService.createInitialUserData(initialUserData).subscribe(() =>
            this._userData.next(initialUserData)
          );
        }
      }
    );
  }

  getUserData(): Observable<UserData> {
    return this._userData.asObservable();
  }

  updateUserData(userData: UserData): Observable<UserData> {
    const obs: Observable<any> = this.userService.updateUserData(userData);

    obs.subscribe(
      data => {
        this._userData.next(data);
      }
    );

    return obs;
  }

  getLaterReads(): Observable<Bookmark[]> {
    if (!this.laterReadsHasBeenRequested) {
      this.laterReadsHasBeenRequested = true;
      const laterReads$ = this.userService.getLaterReads(this.userId).subscribe(data => {
        this._laterReads.next(data);
      });
    }
    return this._laterReads.asObservable();
  }

  addToLaterReads(bookmark: Bookmark) {
    const laterReads: Bookmark[] = this._laterReads.getValue();
    laterReads.push(bookmark);

    this._laterReads.next(laterReads); // insert at the top (index 0)
  }

  removeFromLaterReads(bookmark: Bookmark) {
    this.userData.readLater = this.userData.readLater.filter(x => x !== bookmark._id);
    this.updateUserData(this.userData).subscribe(() => {
      this.publishReadLaterAfterDeletion(bookmark);
    });
  }


  private publishReadLaterAfterDeletion(bookmark: Bookmark) {
    const laterReads: Bookmark[] = this._laterReads.getValue();
    const index = laterReads.findIndex((laterRead) => bookmark._id === laterRead._id);
    if (index !== -1) {
      laterReads.splice(index, 1);
      this._laterReads.next(laterReads);
    }
  }

  getStarredBookmarks(): Observable<Bookmark[]> {
    if (!this.starredBookmarksHasBeenRequested) {
      this.starredBookmarksHasBeenRequested = true;
      const starredBookmarks$ = this.userService.getStarredBookmarks(this.userId).subscribe(data => {
        this._stars.next(data);
      });
    }
    return this._stars.asObservable();
  }

  addToStarredBookmarks(bookmark: Bookmark) {
    const starredBookmarks: Bookmark[] = this._stars.getValue();
    starredBookmarks.unshift(bookmark);

    this._stars.next(starredBookmarks); // insert at the top (index 0)
  }

  removeFromStarredBookmarks(bookmark: Bookmark) {
    const starredBookmarks: Bookmark[] = this._stars.getValue();
    const index = starredBookmarks.findIndex((starredBookmark) => bookmark._id === starredBookmark._id);
    if (index !== -1) {
      starredBookmarks.splice(index, 1);
      this._stars.next(starredBookmarks);
    }
  }

  getPinnedBookmarks(): Observable<Bookmark[]> {
    if (!this.pinnedBookmarksHasBeenRequested) {
      this.pinnedBookmarksHasBeenRequested = true;
      const pinnedBookmarks$ = this.userService.getPinnedBookmarks(this.userId).subscribe(data => {
        this._pinned.next(data);
      });
    }
    return this._pinned.asObservable();
  }

  addToPinnedBookmarks(bookmark: Bookmark) {
    const pinnedBookmarks: Bookmark[] = this._pinned.getValue();
    pinnedBookmarks.unshift(bookmark);

    this._pinned.next(pinnedBookmarks); // insert at the top (index 0)
  }

  removeFromPinnedBookmarks(bookmark: Bookmark) {
    this.userData.pinned = this.userData.pinned.filter(x => x !== bookmark._id);
    this.updateUserData(this.userData).subscribe(() => {
      this.publishedPinnedAfterDeletion(bookmark);
    });
  }

  private publishedPinnedAfterDeletion(bookmark: Bookmark) {
    const pinnedBookmarks: Bookmark[] = this._pinned.getValue();
    const index = pinnedBookmarks.findIndex((pinnedBookmark) => bookmark._id === pinnedBookmark._id);
    if (index !== -1) {
      pinnedBookmarks.splice(index, 1);
      this._pinned.next(pinnedBookmarks);
    }
  }

  getHistory(): Observable<Bookmark[]> {
    if (!this.historyHasBeenRequested) {
      this.historyHasBeenRequested = true;
      this.userService.getLastVisitedBookmarks(this.userId).subscribe(data => {
        this._history.next(data);
      });
    }
    return this._history.asObservable();
  }

  addToHistory(bookmark: Bookmark) {
    this.removeFromUserDataHistoryIfPresent(bookmark);
    this.userData.history.unshift(bookmark._id);
    this.updateUserData(this.userData).subscribe(() => {
      let lastVisitedBookmarks: Bookmark[] = this._history.getValue();
      lastVisitedBookmarks = lastVisitedBookmarks.filter(item => item._id !== bookmark._id);
      lastVisitedBookmarks.unshift(bookmark);

      this._history.next(lastVisitedBookmarks); // insert at the top (index 0)
    });
  }

  private removeFromUserDataHistoryIfPresent(bookmark: Bookmark) {
    const index = this.userData.history.indexOf(bookmark._id);
    if (index !== -1) {
      this.userData.history.splice(index, 1);
    }
  }

  removeFromCategoriesAtDeletion(bookmark: Bookmark) {
    this.userData.history = this.userData.history.filter(x => x !== bookmark._id);
    this.userData.pinned = this.userData.pinned.filter(x => x !== bookmark._id);
    this.userData.readLater = this.userData.readLater.filter(x => x !== bookmark._id);
    this.userData.stars = this.userData.stars.filter(x => x !== bookmark._id);
    this.updateUserData(this.userData).subscribe(() => {
      const lastVisitedBookmarks: Bookmark[] = this._history.getValue();
      const indexHistory = lastVisitedBookmarks.findIndex((lastVisitedBookmark) => bookmark._id === lastVisitedBookmark._id);
      if (indexHistory !== -1) {
        lastVisitedBookmarks.splice(indexHistory, 1);
        this._history.next(lastVisitedBookmarks);
      }

      this.publishedPinnedAfterDeletion(bookmark);
      this.publishReadLaterAfterDeletion(bookmark);
      this.removeFromStarredBookmarks(bookmark);
    });

  }


  getBookmarksForWatchedTags(): Observable<Bookmark[]> {
    if (!this.bookmarksForWatchedTagsHasBeenRequested || this.forceReloadOfBookmarksForWatchedTags) {
      this.bookmarksForWatchedTagsHasBeenRequested = true;
      this.forceReloadOfBookmarksForWatchedTags = false;
      this.userService.getBookmarksForWatchedTags(this.userId).subscribe(data => {
        this._watchedTags.next(data);
      });
    }
    return this._watchedTags.asObservable();
  }

  public forceReloadBookmarksForWatchedTags(): void {
    this.forceReloadOfBookmarksForWatchedTags = true;
  }
}

