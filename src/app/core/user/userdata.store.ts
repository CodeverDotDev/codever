import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';

import { Injectable } from '@angular/core';
import { Logger } from '../logger.service';
import { ErrorService } from '../error/error.service';

import { KeycloakService } from 'keycloak-angular';
import { UserData } from '../model/user-data';
import { UserDataService } from '../user-data.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Bookmark } from '../model/bookmark';
import { UserInfoService } from './user-info.service';
import { UserInfoStore } from './user-info.store';
import { RateBookmarkRequest, RatingActionType } from '../model/rate-bookmark.request';
import { NotifyStoresService } from './notify-stores.service';

@Injectable({
  providedIn: 'root'
})
export class UserDataStore {

  private loadInitialDataCalled = false;
  private _userData: ReplaySubject<UserData> = new ReplaySubject(1);

  private _stars: BehaviorSubject<Bookmark[]> = new BehaviorSubject(null);
  private starredBookmarksHaveBeenLoaded = false;

  private userId: string;

  userData: UserData = {searches: []};

  constructor(private userService: UserDataService,
              private logger: Logger,
              private errorService: ErrorService,
              private keycloakService: KeycloakService,
              private userInfoService: UserInfoService,
              private userInfoStore: UserInfoStore,
              private notifyStoresService: NotifyStoresService,
  ) {

    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.userInfoStore.getUserInfo$().subscribe(userInfo => {
          this.userId = userInfo.sub;
          this.loadInitialUserData(this.userId);
        });
      }
    });
  }

  public loadInitialUserData(userId: string) {
    this.userId = userId;
    this.loadInitialDataCalled = true;
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
    if (!this.loadInitialDataCalled) {
      this.loadInitialUserData(this.userId);
    }
    return this._userData.asObservable();
  }

  updateUserData$(userData: UserData): Observable<UserData> {
    const obs: Observable<any> = this.userService.updateUserData(userData);

    obs.subscribe(
      data => {
        this._userData.next(data);
      }
    );

    return obs;
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
    this.updateUserData$(this.userData).subscribe(() => {
      if (this.starredBookmarksHaveBeenLoaded) {
        const starredBookmarks: Bookmark[] = this._stars.getValue();
        starredBookmarks.unshift(bookmark);
        this._stars.next(starredBookmarks);
      }
    });
  }

  removeFromLikedBookmarks(bookmark: Bookmark) {
    this.userData.likes = this.userData.likes.filter(x => x !== bookmark._id);
    this.updateUserData$(this.userData).subscribe(() => {
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
    this.updateUserData$(this.userData).subscribe(() => {
      this.notifyStoresService.deleteBookmark(bookmark);
/*      this.userDataHistoryStore.publishHistoryAfterDeletion(bookmark);
      this.publishedPinnedAfterDeletion(bookmark);
      this.publishedFavoritesAfterDeletion(bookmark);
      this.publishReadLaterAfterDeletion(bookmark);
      this.publishStarredBookmarksAfterDeletion(bookmark);*/
    });

  }

  likeBookmark(bookmark: Bookmark) {
    bookmark.likeCount++;
    this.userData.likes.unshift(bookmark._id);
    const rateBookmarkRequest: RateBookmarkRequest = {
      ratingUserId: this.userId,
      action: RatingActionType.LIKE,
      bookmark: bookmark
    }
    this.rateBookmark(rateBookmarkRequest);
  }

  unLikeBookmark(bookmark: Bookmark) {
    bookmark.likeCount--;
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

  resetUserDataStore() {
    this.loadInitialDataCalled = false;
    this._userData.next(null);
  }

}

