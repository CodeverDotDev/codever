import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';

import { Injectable } from '@angular/core';
import { Logger } from '../logger.service';
import { ErrorService } from '../error/error.service';
import { Following, Profile, UserData } from '../model/user-data';
import { UserDataService } from '../user-data.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Bookmark } from '../model/bookmark';
import { UserInfoService } from './user-info.service';
import { UserInfoStore } from './user-info.store';
import { RateBookmarkRequest, RatingActionType } from '../model/rate-bookmark.request';
import { NotifyStoresService } from './notify-stores.service';
import { Md5 } from 'ts-md5/dist/md5';

@Injectable({
  providedIn: 'root'
})
export class UserDataStore {

  private _userData: ReplaySubject<UserData> = new ReplaySubject(1);

  private _stars: BehaviorSubject<Bookmark[]> = new BehaviorSubject(null);
  private starredBookmarksHaveBeenLoaded = false;

  private userId: string;
  private userFirstName: string;

  userData: UserData = {profile: {displayName: 'changeMe'}, searches: []};

  constructor(private userService: UserDataService,
              private logger: Logger,
              private errorService: ErrorService,
              private userInfoService: UserInfoService,
              private userInfoStore: UserInfoStore,
              private notifyStoresService: NotifyStoresService,
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

  addToHistoryAndOthers$(bookmark: Bookmark, readLater: boolean, pinned: boolean): Observable<UserData> {
    // history
    this.removeFromUserDataHistoryIfPresent(bookmark);
    this.userData.history.unshift(bookmark._id);

    if (readLater) {
      this.userData.readLater.push(bookmark._id);
    }

    if (pinned) {
      this.userData.pinned.unshift(bookmark._id);
    }

    return this.updateUserData$(this.userData);
  }

  private removeFromUserDataHistoryIfPresent(bookmark: Bookmark) {
    const index = this.userData.history.indexOf(bookmark._id);
    if (index !== -1) {
      this.userData.history.splice(index, 1);
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
}
