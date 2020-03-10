import { BehaviorSubject, Observable } from 'rxjs';

import { Injectable } from '@angular/core';

import { KeycloakService } from 'keycloak-angular';
import { UserDataService } from '../user-data.service';
import { Bookmark } from '../model/bookmark';
import { UserInfoStore } from './user-info.store';
import { NotifyStoresService } from './notify-stores.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FeedStore {

  private _feedBookmarks: BehaviorSubject<Bookmark[]> = new BehaviorSubject(null);
  private feedBookmarksHaveBeenLoaded = false;

  private userId: string;

  loadedPage: number;

  constructor(private userService: UserDataService,
              private keycloakService: KeycloakService,
              private userInfoStore: UserInfoStore,
              private notifyStoresService: NotifyStoresService
  ) {
    this.loadedPage = 1;
    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.userInfoStore.getUserInfo$().subscribe(userInfo => {
          this.userId = userInfo.sub;
        });
      }
    });

    this.notifyStoresService.bookmarkDeleted$.subscribe((bookmark) => {
      this.removeFromFeedBookmarks(bookmark);
    });
  }

  getFeedBookmarks$(page: number): Observable<Bookmark[]> {
    if (this.loadedPage !== page || !this.feedBookmarksHaveBeenLoaded) {
      if (!this.feedBookmarksHaveBeenLoaded) {
        this.feedBookmarksHaveBeenLoaded = true;
      }
      this.userService.getFeedBookmarks(this.userId, page, environment.PAGINATION_PAGE_SIZE).subscribe(data => {
        this.loadedPage = page;
        this._feedBookmarks.next(data);
      });
    }
    return this._feedBookmarks.asObservable();
  }

  public removeFromFeedBookmarks(bookmark: Bookmark) {
    if (this.feedBookmarksHaveBeenLoaded) {
      const myFeedBookmarks: Bookmark[] = this._feedBookmarks.getValue();
      const index = myFeedBookmarks.findIndex((myFeedBookmark) => bookmark._id === myFeedBookmark._id);
      if (index !== -1) {
        myFeedBookmarks.splice(index, 1);
        this._feedBookmarks.next(myFeedBookmarks);
      }
    }
  }

}

