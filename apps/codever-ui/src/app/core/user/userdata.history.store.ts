import { BehaviorSubject, Observable } from 'rxjs';

import { Injectable } from '@angular/core';
import { UserDataService } from '../user-data.service';
import { UserDataResource } from '../model/user-data-resource.type';
import { UserInfoStore } from './user-info.store';
import { NotifyStoresService } from './notify-stores.service';
import { environment } from '../../../environments/environment';
import {
  LocalStorageSaveOptions,
  LocalStorageService,
} from '../cache/local-storage.service';
import { localStorageKeys } from '../model/localstorage.cache-keys';

@Injectable({
  providedIn: 'root',
})
export class UserDataHistoryStore {
  private _history: BehaviorSubject<UserDataResource[]> = new BehaviorSubject(
    null
  );
  private historyHasBeenLoaded = false;

  loadedPage: number;

  constructor(
    private userService: UserDataService,
    private userInfoStore: UserInfoStore,
    private notifyStoresService: NotifyStoresService,
    private localStorageService: LocalStorageService
  ) {
    this.loadedPage = 1;
    this.notifyStoresService.bookmarkDeleted$.subscribe((bookmark) => {
      this.deleteFromHistoryStore(bookmark);
    });
  }

  getHistory$(userId: string, page: number): Observable<UserDataResource[]> {
    if (this.loadedPage !== page || !this.historyHasBeenLoaded) {
      if (!this.historyHasBeenLoaded) {
        this.historyHasBeenLoaded = true;
      }
      this.userService
        .getHistory$(userId, page, environment.PAGINATION_PAGE_SIZE)
        .subscribe((data) => {
          this.historyHasBeenLoaded = true;
          this.loadedPage = page;
          this._history.next(data);
        });
    }

    return this._history.asObservable();
  }

  getAllHistory$(userId: string): Observable<UserDataResource[]> {
    return this.userService.getAllHistory$(userId);
  }

  public updateHistoryStoreBulk(resources: UserDataResource[]) {
    for (const resource of resources) {
      this.updateHistoryStore(resource);
    }
  }

  public updateHistoryStore(resource: UserDataResource) {
    if (this.historyHasBeenLoaded) {
      let lastVisitedResources: UserDataResource[] = this._history.getValue();
      lastVisitedResources = lastVisitedResources.filter(
        (item) => item._id !== resource._id
      );
      lastVisitedResources.unshift(resource);

      this._history.next(lastVisitedResources);
    }
    this.updateEntryLocalStorage(resource);
  }

  private updateEntryLocalStorage(resource: UserDataResource) {
    let resources = this.localStorageService.load(
      localStorageKeys.userHistoryBookmarks
    );
    if (resources) {
      resources = resources.filter((item) => item._id !== resource._id);
      resources.unshift(resource);

      const options: LocalStorageSaveOptions = {
        key: localStorageKeys.userHistoryBookmarks,
        data: resources.slice(0, 100), // in "backend" are max 50 stored
        expirationHours: 24,
      };
      this.localStorageService.save(options);
    }
  }

  public deleteFromHistoryStore(resource: UserDataResource) {
    if (this.historyHasBeenLoaded) {
      const lastVisitedResources: UserDataResource[] = this._history.getValue();
      const indexHistory = lastVisitedResources.findIndex(
        (lastVisitedResource) => resource._id === lastVisitedResource._id
      );
      if (indexHistory !== -1) {
        lastVisitedResources.splice(indexHistory, 1);
        this._history.next(lastVisitedResources);
      }
    }

    this.deleteEntryFromLocalStorage(resource);
  }

  private deleteEntryFromLocalStorage(resource: UserDataResource) {
    const resources = this.localStorageService.load(
      localStorageKeys.userHistoryBookmarks
    );
    if (resources) {
      const indexHistory = resources.findIndex(
        (lastVisitedResource) => resource._id === lastVisitedResource._id
      );
      if (indexHistory !== -1) {
        resources.splice(indexHistory, 1);
        const options: LocalStorageSaveOptions = {
          key: localStorageKeys.userHistoryBookmarks,
          data: resources,
          expirationHours: 24,
        };
        this.localStorageService.save(options);
      }
    }
  }
}
