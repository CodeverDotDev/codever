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
  // Keep quick-access history separate from home-page pages and page sizes.
  private readonly historyPages = new Map<string, HistoryPage>();

  constructor(
    private userService: UserDataService,
    private userInfoStore: UserInfoStore,
    private notifyStoresService: NotifyStoresService,
    private localStorageService: LocalStorageService
  ) {
    this.notifyStoresService.bookmarkDeleted$.subscribe((bookmark) => {
      this.deleteFromHistoryStore(bookmark);
    });
  }

  getHistory$(
    userId: string,
    page: number,
    limit: number = environment.PAGINATION_PAGE_SIZE
  ): Observable<UserDataResource[]> {
    const cacheKey = `${userId}:${page}:${limit}`;
    let historyPage = this.historyPages.get(cacheKey);
    if (!historyPage) {
      historyPage = { page, limit, resources$: new BehaviorSubject(null) };
      this.historyPages.set(cacheKey, historyPage);
    }

    if (!historyPage.loaded) {
      this.userService
        .getHistory$(userId, page, limit)
        .subscribe((data) => {
          historyPage.loaded = true;
          historyPage.resources$.next(data);
        });
    }

    return historyPage.resources$.asObservable();
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
    this.publishHistoryAtTop(resource);
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
    this.historyPages.forEach((historyPage) => {
      if (historyPage.loaded) {
        const resources = historyPage.resources$.getValue() || [];
        const filtered = resources.filter((item) => item._id !== resource._id);
        if (filtered.length !== resources.length) {
          historyPage.resources$.next(filtered);
        }
      }
    });

    this.deleteEntryFromLocalStorage(resource);
  }

  private publishHistoryAtTop(resource: UserDataResource) {
    // History updates affect page 1 only; preserve each view's requested size.
    this.historyPages.forEach((historyPage) => {
      if (historyPage.loaded && historyPage.page === 1) {
        const resources = historyPage.resources$.getValue() || [];
        const withoutResource = resources.filter(
          (item) => item._id !== resource._id
        );
        historyPage.resources$.next(
          [resource, ...withoutResource].slice(0, historyPage.limit)
        );
      }
    });
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

interface HistoryPage {
  page: number;
  limit: number;
  resources$: BehaviorSubject<UserDataResource[]>;
  loaded?: boolean;
}
