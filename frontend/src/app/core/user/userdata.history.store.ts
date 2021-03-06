import { BehaviorSubject, Observable } from 'rxjs';

import { Injectable } from '@angular/core';
import { UserDataService } from '../user-data.service';
import { Bookmark } from '../model/bookmark';
import { UserInfoStore } from './user-info.store';
import { NotifyStoresService } from './notify-stores.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserDataHistoryStore {

  private _history: BehaviorSubject<Bookmark[]> = new BehaviorSubject(null);
  private historyHasBeenLoaded = false;

  loadedPage: number;

  constructor(private userService: UserDataService,
              private userInfoStore: UserInfoStore,
              private notifyStoresService: NotifyStoresService
  ) {
    this.loadedPage = 1;
    this.notifyStoresService.bookmarkDeleted$.subscribe((bookmark) => {
      this.publishHistoryAfterDeletion(bookmark);
    });
  }


  getHistory$(userId: string, page: number, last?: number): Observable<Bookmark[]> {

    const paginationSize = last || environment.PAGINATION_PAGE_SIZE;
    this.userService.getLastVisitedBookmarks(userId, page, paginationSize ).subscribe(data => {
      this.historyHasBeenLoaded = true;
      this.loadedPage = page;
      this._history.next(data);
    });

    return this._history.asObservable();
  }

  public publishHistoryStore(bookmark: Bookmark) {
    if (this.historyHasBeenLoaded) {
      let lastVisitedBookmarks: Bookmark[] = this._history.getValue();
      lastVisitedBookmarks = lastVisitedBookmarks.filter(item => item._id !== bookmark._id);
      lastVisitedBookmarks.unshift(bookmark);

      this._history.next(lastVisitedBookmarks);
      // TODO - this.localStorageService.set('history', lastVisitedBookmarks);
    }
  }

  public publishHistoryAfterDeletion(bookmark: Bookmark) {
    if (this.historyHasBeenLoaded) {
      const lastVisitedBookmarks: Bookmark[] = this._history.getValue();
      const indexHistory = lastVisitedBookmarks.findIndex((lastVisitedBookmark) => bookmark._id === lastVisitedBookmark._id);
      if (indexHistory !== -1) {
        lastVisitedBookmarks.splice(indexHistory, 1);
        this._history.next(lastVisitedBookmarks);
      }
    }
  }

}

