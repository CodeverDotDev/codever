import { BehaviorSubject, Observable } from 'rxjs';

import { Injectable } from '@angular/core';
import { UserDataService } from '../user-data.service';
import { Bookmark } from '../model/bookmark';
import { UserInfoStore } from './user-info.store';
import { NotifyStoresService } from './notify-stores.service';
import { environment } from '../../../environments/environment';
import { LocalStorageSaveOptions, LocalStorageService } from '../cache/local-storage.service';
import { localStorageKeys } from '../model/localstorage.cache-keys';

@Injectable({
  providedIn: 'root'
})
export class UserDataHistoryStore {

  private _history: BehaviorSubject<Bookmark[]> = new BehaviorSubject(null);
  private historyHasBeenLoaded = false;

  loadedPage: number;

  constructor(private userService: UserDataService,
              private userInfoStore: UserInfoStore,
              private notifyStoresService: NotifyStoresService,
              private  localStorageService: LocalStorageService
  ) {
    this.loadedPage = 1;
    this.notifyStoresService.bookmarkDeleted$.subscribe((bookmark) => {
      this.deleteFromHistoryStore(bookmark);
    });
  }


  getHistory$(userId: string, page: number, last?: number): Observable<Bookmark[]> {

    const paginationSize = last || environment.PAGINATION_PAGE_SIZE;
    this.userService.getHistory$(userId, page, paginationSize).subscribe(data => {
      this.historyHasBeenLoaded = true;
      this.loadedPage = page;
      this._history.next(data);
    });

    return this._history.asObservable();
  }

  getAllHistory$(userId: string): Observable<Bookmark[]> {
    return this.userService.getAllHistory$(userId);
  }

  public updateHistoryStore(bookmark: Bookmark) {
    if (this.historyHasBeenLoaded) {
      let lastVisitedBookmarks: Bookmark[] = this._history.getValue();
      lastVisitedBookmarks = lastVisitedBookmarks.filter(item => item._id !== bookmark._id);
      lastVisitedBookmarks.unshift(bookmark);

      this._history.next(lastVisitedBookmarks);
    }
    this.updateEntryLocalStorage(bookmark);
  }

  private updateEntryLocalStorage(bookmark: Bookmark) {
    let bookmarks = this.localStorageService.load(localStorageKeys.userHistoryBookmarks);
    if (bookmarks) {
      bookmarks = bookmarks.filter(item => item._id !== bookmark._id);
      bookmarks.unshift(bookmark);

      const options: LocalStorageSaveOptions = {
        key: localStorageKeys.userHistoryBookmarks,
        data: bookmarks,
        expirationHours: 24
      };
      this.localStorageService.save(options);
    }

  }

  public deleteFromHistoryStore(bookmark: Bookmark) {
    if (this.historyHasBeenLoaded) {
      const lastVisitedBookmarks: Bookmark[] = this._history.getValue();
      const indexHistory = lastVisitedBookmarks.findIndex((lastVisitedBookmark) => bookmark._id === lastVisitedBookmark._id);
      if (indexHistory !== -1) {
        lastVisitedBookmarks.splice(indexHistory, 1);
        this._history.next(lastVisitedBookmarks);
      }
    }

    this.deleteEntryFromLocalStorage(bookmark);
  }

  private deleteEntryFromLocalStorage(bookmark: Bookmark) {
    const bookmarks = this.localStorageService.load(localStorageKeys.userHistoryBookmarks);
    if (bookmarks) {
      const indexHistory = bookmarks.findIndex((lastVisitedBookmark) => bookmark._id === lastVisitedBookmark._id);
      if (indexHistory !== -1) {
        bookmarks.splice(indexHistory, 1);
        const options: LocalStorageSaveOptions = {
          key: localStorageKeys.userHistoryBookmarks,
          data: bookmarks,
          expirationHours: 24
        };
        this.localStorageService.save(options);
      }
    }

  }
}

