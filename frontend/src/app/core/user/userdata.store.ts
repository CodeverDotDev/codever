import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';

import { Injectable } from '@angular/core';
import { Logger } from '../logger.service';
import { ErrorService } from '../error/error.service';
import { Following, Profile, Search, UserData } from '../model/user-data';
import { UserDataService } from '../user-data.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Bookmark } from '../model/bookmark';
import { UserInfoService } from './user-info.service';
import { UserInfoStore } from './user-info.store';
import { RateBookmarkRequest, RatingActionType } from '../model/rate-bookmark.request';
import { NotifyStoresService } from './notify-stores.service';
import { Md5 } from 'ts-md5/dist/md5';
import { UserDataHistoryStore } from './userdata.history.store';
import { PersonalBookmarksService } from '../personal-bookmarks.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserDataStore {

  private _userData: ReplaySubject<UserData> = new ReplaySubject(1);

  private _stars: BehaviorSubject<Bookmark[]> = new BehaviorSubject(null);
  private starredBookmarksHaveBeenLoaded = false;

  private userId: string;
  private userFirstName: string;

  // userData is initialized here to avoid some nasty undefined exceptions before the actual data is loaded
  userData: UserData = {profile: {displayName: 'changeMe'}, searches: [], recentSearches: []};

  constructor(private userService: UserDataService,
              private logger: Logger,
              private errorService: ErrorService,
              private userInfoService: UserInfoService,
              private userInfoStore: UserInfoStore,
              private notifyStoresService: NotifyStoresService,
              private userDataHistoryStore: UserDataHistoryStore,
              private personalBookmarksService: PersonalBookmarksService
  ) {
  }

  public loadInitialUserData(userId: string, userFirstName: string, email: string) {
    this.userId = userId;
    this.userFirstName = userFirstName;
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
        const userDataNotCreated = errorResponse.status === 404 && errorResponse.error.message === `User data NOT_FOUND for userId: ${this.userId}`;
        if (userDataNotCreated) {
          this.createInitialUserData(email, userId);
        }
      }
    );
  }

  private createInitialUserData(email: string, userId: string) {
    const profile: Profile = {
      displayName: this.userFirstName,
      imageUrl: this.getGravatarImageUrl(email),
    }
    const following: Following = {
      users: [],
      tags: []
    }
    const initialUserData: UserData = {
      userId: userId,
      profile: profile,
      searches: [],
      recentSearches: [],
      readLater: [],
      likes: [],
      watchedTags: [],
      ignoredTags: [],
      pinned: [],
      favorites: [],
      history: [],
      followers: [],
      following: following
    }

    this.userService.createInitialUserData(initialUserData).subscribe((data) => {
        this.userData = data;
        this._userData.next(data);
      }
    );
  }

  private getGravatarImageUrl(email: string): string {
    const md5 = new Md5();
    md5.appendStr(email);
    const response = `https://gravatar.com/avatar/${md5.end()}?s=340`;

    return response;
  }

  getUserData$(): Observable<UserData> {
    return this._userData.asObservable();
  }

  updateUserData$(userData: UserData): Observable<UserData> {
    const obs: Observable<UserData> = this.userService.updateUserData(userData);

    obs.subscribe(
      data => {
        this._userData.next(data);
      }
    );

    return obs;
  }

  updateHistoryReadLaterAndPinned$(bookmark: Bookmark, readLater: boolean, pinned: boolean): Observable<UserData> {
    // history
    this.removeFromUserDataHistoryIfPresent(bookmark);
    this.userData.history.unshift(bookmark._id);
    let readLaterList = [];
    if (readLater) {
      this.userData.readLater.push(bookmark._id);
      readLaterList = this.userData.readLater;
    }

    let pinnedList = [];
    if (pinned) {
      this.userData.pinned.unshift(bookmark._id);
      pinnedList = this.userData.pinned;
    }

    const obs: Observable<any> = this.userService.updateUserDataHistoryReadLaterPinned(this.userId, this.userData.history, readLaterList, pinnedList);
    obs.subscribe(
      () => {
        this._userData.next(this.userData);
      }
    );

    return obs;
  }

  updateUserDataHistory$(bookmark: Bookmark): Observable<UserData> {
    // history
    this.removeFromUserDataHistoryIfPresent(bookmark);
    this.userData.history.unshift(bookmark._id);
    const obs: Observable<any> = this.userService.updateUserDataHistory(this.userId, this.userData.history);
    obs.subscribe(
      () => {
        this.userDataHistoryStore.publishHistoryStore(bookmark);
        if (this.userId === bookmark.userId) {
          this.personalBookmarksService.increaseOwnerVisitCount(bookmark).subscribe();
        }
        this._userData.next(this.userData);
      }
    );

    return obs;
  }

  private removeFromUserDataHistoryIfPresent(bookmark: Bookmark) {
    const index = this.userData.history.indexOf(bookmark._id);
    if (index !== -1) {
      this.userData.history.splice(index, 1);
    }
  }

  addToUserDataPinned$(bookmark: Bookmark): Observable<UserData> {
    this.userData.pinned.unshift(bookmark._id);
    const obs: Observable<any> = this.userService.updateUserDataPinned(this.userId, this.userData.pinned);
    obs.subscribe(
      () => {
        this._userData.next(this.userData);
      }
    );

    return obs;
  }

  removeFromUserDataPinned$(bookmark: Bookmark): Observable<UserData> {
    this.userData.pinned = this.userData.pinned.filter(x => x !== bookmark._id);
    const obs: Observable<any> = this.userService.updateUserDataPinned(this.userId, this.userData.pinned);
    obs.subscribe(
      () => {
        this._userData.next(this.userData);
      }
    );

    return obs;
  }

  addToUserReadLater$(bookmark: Bookmark): Observable<UserData> {
    this.userData.readLater.push(bookmark._id);
    const obs: Observable<any> = this.userService.updateUserDataReadLater(this.userId, this.userData.readLater);
    obs.subscribe(
      () => {
        this._userData.next(this.userData);
      }
    );

    return obs;
  }

  removeFromUserDataReadLater$(bookmark: Bookmark): Observable<UserData> {
    this.userData.readLater = this.userData.readLater.filter(x => x !== bookmark._id);
    const obs: Observable<any> = this.userService.updateUserDataReadLater(this.userId, this.userData.readLater);
    obs.subscribe(
      () => {
        this._userData.next(this.userData);
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

  removeFromStoresAtDeletion(bookmark: Bookmark) {
    this.userData.history = this.userData.history.filter(x => x !== bookmark._id);
    this.userData.pinned = this.userData.pinned.filter(x => x !== bookmark._id);
    this.userData.favorites = this.userData.favorites.filter(x => x !== bookmark._id);
    this.userData.readLater = this.userData.readLater.filter(x => x !== bookmark._id);
    this.userData.likes = this.userData.likes.filter(x => x !== bookmark._id);
    this.updateUserData$(this.userData).subscribe(() => {
      this.notifyStoresService.deleteBookmark(bookmark);
    });

  }

  likeBookmark(bookmark: Bookmark) {
    bookmark.likeCount++;
    const rateBookmarkRequest: RateBookmarkRequest = {
      ratingUserId: this.userId,
      action: RatingActionType.LIKE,
      bookmark: bookmark
    }
    this.rateBookmark(rateBookmarkRequest);
  }

  unLikeBookmark(bookmark: Bookmark) {
    bookmark.likeCount--;

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
    this._userData.next(null);
  }

  followUser$(followedUserId: string): Observable<UserData> {
    const obs: Observable<UserData> = this.userService.followUser(this.userId, followedUserId);

    obs.subscribe((userData) => {
      this._userData.next(userData);
    });

    return obs;
  }

  unfollowUser$(followedUserId: string): Observable<UserData> {
    const obs: Observable<UserData> = this.userService.unfollowUser(this.userId, followedUserId);
    obs.subscribe((userData) => {
      this._userData.next(userData);
    });

    return obs;
  }

  saveRecentSearch(searchText: string, searchDomain: any) {
    if (this.userId !== undefined) {
      const now = new Date();
      const newSearch: Search = {
        text: searchText,
        createdAt: now,
        saved: false,
        lastAccessedAt: now,
        searchDomain: searchDomain,
        count: 1
      }
      const emptyUserData = Object.keys(this.userData).length === 0 && this.userData.constructor === Object;
      if (emptyUserData) {
        this.userData = {
          userId: this.userId,
          recentSearches: [newSearch]
        }
      } else {
        const existingSearchIndex = this.userData.searches.findIndex(
          element => element.searchDomain === searchDomain && element.text.trim().toLowerCase() === searchText.trim().toLowerCase());

        if (existingSearchIndex !== -1) {
          const existingSearch = this.userData.searches.splice(existingSearchIndex, 1)[0];
          existingSearch.lastAccessedAt = now;
          existingSearch.count++;
          this.userData.searches.unshift(existingSearch);
        } else {
          const notSavedSearchesProDomainCount = this.userData.searches.reduce((total, element) => (!element.saved && element.searchDomain === searchDomain ? total + 1 : total), 0);
          if (notSavedSearchesProDomainCount > environment.SAVED_RECENT_SEARCH_PRO_DOMAIN_SIZE) {
            this.removeLastSearchNotSavedAndFromDomain(searchDomain);
          }
          this.userData.searches.unshift(newSearch);
        }
      }
      this.updateUserData$(this.userData);
    }
  }

  private removeLastSearchNotSavedAndFromDomain(searchDomain: any) {
    for (let i = this.userData.searches.length - 1; i > 0; i--) {
      const isNotSavedAndFromSearchDomain = this.userData.searches[i].saved === false
        && this.userData.searches[i].searchDomain === searchDomain;
      if (isNotSavedAndFromSearchDomain) {
        this.userData.searches.splice(i, 1);
        break;
      }
    }
  }
}
