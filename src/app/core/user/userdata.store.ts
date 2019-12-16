import {BehaviorSubject, Observable, ReplaySubject} from 'rxjs';

import {Injectable} from '@angular/core';
import {Logger} from '../logger.service';
import {ErrorService} from '../error/error.service';

import {KeycloakService} from 'keycloak-angular';
import {UserData} from '../model/user-data';
import {UserDataService} from '../user-data.service';
import {HttpErrorResponse} from '@angular/common/http';
import {Bookmark} from '../model/bookmark';
import {UserInfoService} from './user-info.service';
import {UserInfoStore} from './user-info.store';
import {RateBookmarkRequest, RatingActionType} from '../model/rate-bookmark.request';

@Injectable({
  providedIn: 'root'
})
export class UserDataStore {

  private loadInitilDataCalled = false;
  private _userData: ReplaySubject<UserData> = new ReplaySubject(1);

  private _laterReads: BehaviorSubject<Bookmark[]> = new BehaviorSubject(null);
  private laterReadsHaveBeenLoaded = false;

  private _stars: BehaviorSubject<Bookmark[]> = new BehaviorSubject(null);
  private starredBookmarksHaveBeenLoaded = false;

  private _pinned: BehaviorSubject<Bookmark[]> = new BehaviorSubject(null);
  private pinnedBookmarksHaveBeenLoaded = false;

  private _favorites: BehaviorSubject<Bookmark[]> = new BehaviorSubject(null);
  private favoriteBookmarksHaveBeenLoaded = false;

  private _history: BehaviorSubject<Bookmark[]> = new BehaviorSubject(null);
  private historyHasBeenLoaded = false;

  private _watchedTags: BehaviorSubject<Bookmark[]> = new BehaviorSubject(null);
  private bookmarksForWatchedTagsHaveBeenLoaded = false;
  private forceReloadOfBookmarksForWatchedTags = false; // modified when the user changes the watched tags

  private userId: string;

  userData: UserData = {searches: []};

  constructor(private userService: UserDataService,
              private logger: Logger,
              private errorService: ErrorService,
              private keycloakService: KeycloakService,
              private userInfoService: UserInfoService,
              private userInfoStore: UserInfoStore,
  ) {

    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.userInfoStore.getUserInfo$().subscribe(userInfo => {
          this.userId = userInfo.sub;
          this.loadInitialData(this.userId);
        });
      }
    });
  }

  public loadInitialData(userId: string) {
    this.userId = userId;
    this.loadInitilDataCalled = true;
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
        if (errorResponse.status === 404 && errorResponse.error.message === `User data NOT_FOUND for userId: ${this.userId}`) {
          const initialUserData: UserData = {
            userId: userId,
            searches: [],
            readLater: [],
            likes: [],
            watchedTags: [],
            pinned: [],
            favorites: [],
            history: []
          }

          this.userService.createInitialUserData(initialUserData).subscribe((data) => {
              this.userData = data;
              this._userData.next(data);
            }
          );
        }
      }
    );
  }

  getUserData$(): Observable<UserData> {
    if (!this.loadInitilDataCalled) {
      this.loadInitialData(this.userId);
    }
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

  getLaterReads$(): Observable<Bookmark[]> {
    if (!this.laterReadsHaveBeenLoaded) {
      this.userService.getLaterReads(this.userId).subscribe(data => {
        this.laterReadsHaveBeenLoaded = true;
        this._laterReads.next(data);
      });
    }
    return this._laterReads.asObservable();
  }

  addToLaterReads(bookmark: Bookmark) {
    this.userData.readLater.push(bookmark._id);
    this.updateUserData(this.userData).subscribe(() => {
      this.publishLaterReadsAfterCreation(bookmark);
    });
  }

  removeFromLaterReads(bookmark: Bookmark) {
    this.userData.readLater = this.userData.readLater.filter(x => x !== bookmark._id);
    this.updateUserData(this.userData).subscribe(() => {
      this.publishReadLaterAfterDeletion(bookmark);
    });
  }

  private publishReadLaterAfterDeletion(bookmark: Bookmark) {
    if (this.laterReadsHaveBeenLoaded) {
      const laterReads: Bookmark[] = this._laterReads.getValue();
      const index = laterReads.findIndex((laterRead) => bookmark._id === laterRead._id);
      if (index !== -1) {
        laterReads.splice(index, 1);
        this._laterReads.next(laterReads);
      }
    }
  }

  getLikedBookmarks$(): Observable<Bookmark[]> {
    if (!this.starredBookmarksHaveBeenLoaded) {
      this.userService.getLikedBookmarks(this.userId).subscribe(data => {
        this.starredBookmarksHaveBeenLoaded = true;
        this._stars.next(data);
      });
    }
    return this._stars.asObservable();
  }

  addToLikedBookmarks(bookmark: Bookmark) {
    this.userData.likes.unshift(bookmark._id);
    this.updateUserData(this.userData).subscribe(() => {
      if (this.starredBookmarksHaveBeenLoaded) {
        const starredBookmarks: Bookmark[] = this._stars.getValue();
        starredBookmarks.unshift(bookmark);
        this._stars.next(starredBookmarks);
      }
    });
  }

  removeFromLikedBookmarks(bookmark: Bookmark) {
    this.userData.likes = this.userData.likes.filter(x => x !== bookmark._id);
    this.updateUserData(this.userData).subscribe(() => {
      this.publishStarredBookmarksAfterDeletion(bookmark);
    });

  }

  private publishStarredBookmarksAfterDeletion(bookmark: Bookmark) {
    if (this.starredBookmarksHaveBeenLoaded) {
      if (this.starredBookmarksHaveBeenLoaded) {
        const starredBookmarks: Bookmark[] = this._stars.getValue();
        const index = starredBookmarks.findIndex((starredBookmark) => bookmark._id === starredBookmark._id);
        if (index !== -1) {
          starredBookmarks.splice(index, 1);
          this._stars.next(starredBookmarks);
        }
      }
    }
  }

  getPinnedBookmarks$(): Observable<Bookmark[]> {
    if (!this.pinnedBookmarksHaveBeenLoaded) {
      this.userService.getPinnedBookmarks(this.userId).subscribe(data => {
        this.pinnedBookmarksHaveBeenLoaded = true;
        this._pinned.next(data);
      });
    }
    return this._pinned.asObservable();
  }

  addToPinnedBookmarks(bookmark: Bookmark) {
    this.userData.pinned.unshift(bookmark._id);
    this.updateUserData(this.userData).subscribe(() => {
      if (this.pinnedBookmarksHaveBeenLoaded) {
        const pinnedBookmarks: Bookmark[] = this._pinned.getValue();
        pinnedBookmarks.unshift(bookmark);

        this._pinned.next(pinnedBookmarks); // insert at the top (index 0)
      }
    });
  }

  removeFromPinnedBookmarks(bookmark: Bookmark) {
    this.userData.pinned = this.userData.pinned.filter(x => x !== bookmark._id);
    this.updateUserData(this.userData).subscribe(() => {
      this.publishedPinnedAfterDeletion(bookmark);
    });
  }

  private publishedPinnedAfterDeletion(bookmark: Bookmark) {
    if (this.pinnedBookmarksHaveBeenLoaded) {
      const pinnedBookmarks: Bookmark[] = this._pinned.getValue();
      const index = pinnedBookmarks.findIndex((pinnedBookmark) => bookmark._id === pinnedBookmark._id);
      if (index !== -1) {
        pinnedBookmarks.splice(index, 1);
        this._pinned.next(pinnedBookmarks);
      }
    }
  }

  getFavoriteBookmarks$(): Observable<Bookmark[]> {
    if (!this.favoriteBookmarksHaveBeenLoaded) {
      this.userService.getFavoriteBookmarks(this.userId).subscribe(data => {
        this.favoriteBookmarksHaveBeenLoaded = true;
        this._favorites.next(data);
      });
    }
    return this._favorites.asObservable();
  }

  addToFavoriteBookmarks(bookmark: Bookmark) {
    this.userData.favorites.unshift(bookmark._id);
    this.updateUserData(this.userData).subscribe(() => {
      if (this.favoriteBookmarksHaveBeenLoaded) {
        const favoritesBookmarks: Bookmark[] = this._favorites.getValue();
        favoritesBookmarks.unshift(bookmark);

        this._favorites.next(favoritesBookmarks); // insert at the top (index 0)
      }
    });
  }

  removeFromFavoriteBookmarks(bookmark: Bookmark) {
    this.userData.favorites = this.userData.favorites.filter(x => x !== bookmark._id);
    this.updateUserData(this.userData).subscribe(() => {
      this.publishedFavoritesAfterDeletion(bookmark);
    });
  }

  private publishedFavoritesAfterDeletion(bookmark: Bookmark) {
    if (this.favoriteBookmarksHaveBeenLoaded) {
      const favoritesBookmarks: Bookmark[] = this._favorites.getValue();
      const index = favoritesBookmarks.findIndex((favoriteBookmark) => bookmark._id === favoriteBookmark._id);
      if (index !== -1) {
        favoritesBookmarks.splice(index, 1);
        this._favorites.next(favoritesBookmarks);
      }
    }
  }

  getHistory$(): Observable<Bookmark[]> {
    if (!this.historyHasBeenLoaded) {
      this.userService.getLastVisitedBookmarks(this.userId).subscribe(data => {
        this.historyHasBeenLoaded = true;
        this._history.next(data);
      });
    }
    return this._history.asObservable();
  }

  addToHistory(bookmark: Bookmark) {
    this.removeFromUserDataHistoryIfPresent(bookmark);
    this.userData.history.unshift(bookmark._id);
    this.updateUserData(this.userData).subscribe(() => {
      this.publishHistoryAfterCreation(bookmark);
    });
  }

  addToHistoryAndReadLater(bookmark: Bookmark) {
    // history
    this.removeFromUserDataHistoryIfPresent(bookmark);
    this.userData.history.unshift(bookmark._id);

    // read later
    this.userData.readLater.push(bookmark._id);

    this.updateUserData(this.userData).subscribe(() => {
      this.publishHistoryAfterCreation(bookmark);
      this.publishLaterReadsAfterCreation(bookmark);
    });
  }

  private publishLaterReadsAfterCreation(bookmark: Bookmark) {
    if (this.laterReadsHaveBeenLoaded) {
      const laterReads: Bookmark[] = this._laterReads.getValue();
      laterReads.push(bookmark);
      this._laterReads.next(laterReads); // insert at the top (index 0)
    }
  }

  private publishHistoryAfterCreation(bookmark: Bookmark) {
    if (this.historyHasBeenLoaded) {
      let lastVisitedBookmarks: Bookmark[] = this._history.getValue();
      lastVisitedBookmarks = lastVisitedBookmarks.filter(item => item._id !== bookmark._id);
      lastVisitedBookmarks.unshift(bookmark);

      this._history.next(lastVisitedBookmarks);
    }
  }

  private removeFromUserDataHistoryIfPresent(bookmark: Bookmark) {
    const index = this.userData.history.indexOf(bookmark._id);
    if (index !== -1) {
      this.userData.history.splice(index, 1);
    }
  }

  removeFromStoresAtDeletion(bookmark: Bookmark) {
    this.userData.history = this.userData.history.filter(x => x !== bookmark._id);
    this.userData.pinned = this.userData.pinned.filter(x => x !== bookmark._id);
    this.userData.favorites = this.userData.favorites.filter(x => x !== bookmark._id);
    this.userData.readLater = this.userData.readLater.filter(x => x !== bookmark._id);
    this.userData.likes = this.userData.likes.filter(x => x !== bookmark._id);
    this.updateUserData(this.userData).subscribe(() => {
      this.publishHistoryAfterDeletion(bookmark);
      this.publishedPinnedAfterDeletion(bookmark);
      this.publishedFavoritesAfterDeletion(bookmark);
      this.publishReadLaterAfterDeletion(bookmark);
      this.publishStarredBookmarksAfterDeletion(bookmark);
    });

  }

  private publishHistoryAfterDeletion(bookmark: Bookmark) {
    if (this.historyHasBeenLoaded) {
      const lastVisitedBookmarks: Bookmark[] = this._history.getValue();
      const indexHistory = lastVisitedBookmarks.findIndex((lastVisitedBookmark) => bookmark._id === lastVisitedBookmark._id);
      if (indexHistory !== -1) {
        lastVisitedBookmarks.splice(indexHistory, 1);
        this._history.next(lastVisitedBookmarks);
      }
    }

  }

  getBookmarksForWatchedTags$(): Observable<Bookmark[]> {
    if (!this.bookmarksForWatchedTagsHaveBeenLoaded || this.forceReloadOfBookmarksForWatchedTags) {
      this.bookmarksForWatchedTagsHaveBeenLoaded = true;
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

  likeBookmark(bookmark: Bookmark) {
    bookmark.likes++;
    this.userData.likes.unshift(bookmark._id);
    const rateBookmarkRequest: RateBookmarkRequest = {
      ratingUserId: this.userId,
      action: RatingActionType.LIKE,
      bookmark: bookmark
    }
    this.rateBookmark(rateBookmarkRequest);
  }

  unLikeBookmark(bookmark: Bookmark) {
    bookmark.likes--;
    this.userData.likes.splice(this.userData.likes.indexOf(bookmark._id), 1);
    const rateBookmarkRequest: RateBookmarkRequest = {
      ratingUserId: this.userId,
      action: RatingActionType.UNLIKE,
      bookmark: bookmark
    }

    this.rateBookmark(rateBookmarkRequest);
  }

  private rateBookmark(rateBookmarkRequest: RateBookmarkRequest) {
    this.userService.rateBookmark(rateBookmarkRequest).subscribe(() => {
      if (rateBookmarkRequest.action === RatingActionType.LIKE) {
        this.addToLikedBookmarks(rateBookmarkRequest.bookmark);
      } else {
        this.removeFromLikedBookmarks(rateBookmarkRequest.bookmark);
      }
    });
  }

  watchTag(tag: string) {
    this.userData.watchedTags.push(tag);
    this.updateUserData(this.userData).subscribe(() => {
      this.forceReloadBookmarksForWatchedTags();
    });
  }

  unwatchTag(tag: string) {
    const index = this.userData.watchedTags.indexOf(tag);
    if (index > -1) {
      this.userData.watchedTags.splice(index, 1);
      this.updateUserData(this.userData).subscribe(() => {
        this.forceReloadBookmarksForWatchedTags();
      });
    }
  }

  resetUserDataStore() {
    this.loadInitilDataCalled = false;
    this._userData.next(null);
  }

}

