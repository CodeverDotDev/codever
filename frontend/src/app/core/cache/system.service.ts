import { Injectable } from '@angular/core'
import { LocalStorageService } from './local-storage.service'
import { environment } from '../../../environments/environment'
import { localStorageKeys } from '../model/localstorage.cache-keys';

@Injectable()
export class SystemService {

  // List of cached queries that'll removed from localStorage after each new "cache" version release
  cachedQueries = {
    PUBLIC_TAGS_LIST: `${environment.API_URL}/public/bookmarks`
  }

  // List of cached keys that will be removed from localStorate after each new "cache" version release
  cachedKeys = [];

  constructor(
    private localStorageService: LocalStorageService
  ) {
  }

  checkVersion() {
    if (this.userHasOlderVersion()) {

      // Simply clear all caches - for more refine cleaning see the possibilities below
      this.localStorageService.cleanLocalStorage();

      // Set new version
      this.localStorageService.save({key: localStorageKeys.cacheVersion, data: environment.LOCALSTORAGE_CACHE_VERSION})

      // **** more refined cache clearing, if necessary in the future ******
      // Cleanup cached queries to avoid inconsistencies
      // this.localStorageService.cleanCachedKeys(this.cachedKeys);
      // Cleanup cached queries to avoid inconsistencies
      // this.localStorageService.cleanCachedQueries(this.cachedQueries);
    }
  }

  userHasOlderVersion(): boolean {
    const userVersion = this.localStorageService.load(localStorageKeys.cacheVersion);

    if (userVersion === null) {
      return true;
    }

    return userVersion !== environment.LOCALSTORAGE_CACHE_VERSION;
  }

}
