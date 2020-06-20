import { BehaviorSubject, Observable } from 'rxjs';

import { Injectable } from '@angular/core';

import { KeycloakService } from 'keycloak-angular';
import { UserData } from '../model/user-data';
import { UserDataService } from '../user-data.service';
import { Bookmark } from '../model/bookmark';
import { UserInfoStore } from './user-info.store';
import { NotifyStoresService } from './notify-stores.service';
import { UserDataStore } from './userdata.store';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserDataPinnedStore {

  private _pinned: BehaviorSubject<Bookmark[]> = new BehaviorSubject(null);
  private pinnedBookmarksHaveBeenLoaded = false;

  private userId: string;
  private userData: UserData;

  loadedPage: number;

  constructor(private userService: UserDataService,
              private userDataStore: UserDataStore,
              private keycloakService: KeycloakService,
              private userInfoStore: UserInfoStore,
              private notifyStoresService: NotifyStoresService
  ) {
    this.loadedPage = 1;
    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.userInfoStore.getUserInfo$().subscribe(userInfo => {
          this.userId = userInfo.sub;
          this.userDataStore.getUserData$().subscribe(userData => {
            this.userData = userData;
          });
        });
      }
    });
    this.notifyStoresService.bookmarkDeleted$.subscribe((bookmark) => {
      this.publishedPinnedAfterDeletion(bookmark);
    });
  }


  getPinnedBookmarks$(page: number): Observable<Bookmark[]> {
    if (this.loadedPage !== page || !this.pinnedBookmarksHaveBeenLoaded) {
      this.userService.getPinnedBookmarks(this.userId, page, environment.PAGINATION_PAGE_SIZE).subscribe(data => {
        if (!this.pinnedBookmarksHaveBeenLoaded) {
          this.pinnedBookmarksHaveBeenLoaded = true;
        }
        this.pinnedBookmarksHaveBeenLoaded = true;
        this.loadedPage = page;
        this._pinned.next(data);
      });
    }
    return this._pinned.asObservable();
  }

  addToPinnedBookmarks(bookmark: Bookmark) {
    this.userData.pinned.unshift(bookmark._id);
    this.userDataStore.updateUserData$(this.userData).subscribe(() => {
      if (this.pinnedBookmarksHaveBeenLoaded) {
        const pinnedBookmarks: Bookmark[] = this._pinned.getValue();
        pinnedBookmarks.unshift(bookmark);

        this._pinned.next(pinnedBookmarks); // insert at the top (index 0)
      }
    });
  }

  removeFromPinnedBookmarks(bookmark: Bookmark) {
    this.userData.pinned = this.userData.pinned.filter(x => x !== bookmark._id);
    this.userDataStore.updateUserData$(this.userData).subscribe(() => {
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

  public publishReadLaterAfterCreation(bookmark: Bookmark) {
    if (this.pinnedBookmarksHaveBeenLoaded) {
      const pinned: Bookmark[] = this._pinned.getValue();
      pinned.unshift(bookmark);
      this._pinned.next(pinned); // insert at the top (index 0)
    }
  }

}

