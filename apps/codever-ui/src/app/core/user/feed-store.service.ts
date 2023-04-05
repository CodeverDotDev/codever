import { BehaviorSubject, Observable } from 'rxjs';

import { Injectable } from '@angular/core';
import { UserDataService } from '../user-data.service';
import { Bookmark } from '../model/bookmark';
import { UserInfoStore } from './user-info.store';
import { NotifyStoresService } from './notify-stores.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FeedStore {
  readonly FIRST_PAGE = 1;

  private _feedBookmarks: BehaviorSubject<Bookmark[]> = new BehaviorSubject(
    null
  );
  private feedBookmarksHaveBeenLoaded = false;

  loadedPage: number;

  constructor(
    private userService: UserDataService,
    private userInfoStore: UserInfoStore,
    private notifyStoresService: NotifyStoresService
  ) {
    this.loadedPage = this.FIRST_PAGE;

    this.notifyStoresService.bookmarkDeleted$.subscribe((bookmark) => {
      this.removeFromFeedBookmarks(bookmark);
    });
  }

  getFeedBookmarks$(userId: string, page: number): Observable<Bookmark[]> {
    if (this.loadedPage !== page || !this.feedBookmarksHaveBeenLoaded) {
      if (!this.feedBookmarksHaveBeenLoaded) {
        this.feedBookmarksHaveBeenLoaded = true;
      }
      this.userService
        .getFeedBookmarks(userId, page, environment.PAGINATION_PAGE_SIZE)
        .subscribe((data) => {
          this.loadedPage = page;
          this._feedBookmarks.next(data);
        });
    }
    return this._feedBookmarks.asObservable();
  }

  public removeFromFeedBookmarks(bookmark: Bookmark) {
    if (this.feedBookmarksHaveBeenLoaded) {
      const myFeedBookmarks: Bookmark[] = this._feedBookmarks.getValue();
      const index = myFeedBookmarks.findIndex(
        (myFeedBookmark) => bookmark._id === myFeedBookmark._id
      );
      if (index !== -1) {
        myFeedBookmarks.splice(index, 1);
        this._feedBookmarks.next(myFeedBookmarks);
      }
    }
  }
}
