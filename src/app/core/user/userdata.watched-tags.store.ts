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
export class UserDataWatchedTagsStore {

  private _watchedTags: BehaviorSubject<Bookmark[]> = new BehaviorSubject(null);
  private bookmarksForWatchedTagsHaveBeenLoaded = false;
  private forceReloadOfBookmarksForWatchedTags = false; // modified when the user changes the watched tags

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
      // TODO remove from watched tags...
    });
  }

  getBookmarksForWatchedTags$(page: number): Observable<Bookmark[]> {
    if (this.loadedPage !== page || !this.bookmarksForWatchedTagsHaveBeenLoaded || this.forceReloadOfBookmarksForWatchedTags) {
      if (!this.bookmarksForWatchedTagsHaveBeenLoaded) {
        this.bookmarksForWatchedTagsHaveBeenLoaded = true;
      }
      if (this.forceReloadOfBookmarksForWatchedTags) {
        this.forceReloadOfBookmarksForWatchedTags = false;
      }

      this.userService.getBookmarksForWatchedTags(this.userId, page, environment.PAGINATION_PAGE_SIZE).subscribe(data => {
        this.loadedPage = page;
        this._watchedTags.next(data);
      });
    }
    return this._watchedTags.asObservable();
  }

  public forceReloadBookmarksForWatchedTags(): void {
    this.forceReloadOfBookmarksForWatchedTags = true;
  }

  watchTag(tag: string) {
    this.userData.watchedTags.push(tag);
    this.userDataStore.updateUserData$(this.userData).subscribe(() => {
      this.forceReloadBookmarksForWatchedTags();
    });
  }

  unwatchTag(tag: string) {
    const index = this.userData.watchedTags.indexOf(tag);
    if (index > -1) {
      this.userData.watchedTags.splice(index, 1);
      this.userDataStore.updateUserData$(this.userData).subscribe(() => {
        this.forceReloadBookmarksForWatchedTags();
      });
    }
  }

}

