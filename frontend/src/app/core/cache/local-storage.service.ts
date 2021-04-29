import { Injectable } from '@angular/core'
import { localStorageKeys } from '../model/localstorage.cache-keys';

@Injectable()
export class LocalStorageService {
  constructor() {
  }

  save(options: LocalStorageSaveOptions) {
    // Set default values for optionals
    options.expirationHours = options.expirationHours || 0

    // Set expiration date in milliseconds
    const expirationMS = options.expirationHours !== 0 ? options.expirationHours * 60 * 60 * 1000 : 0

    const record = {
      value: typeof options.data === 'string' ? options.data : JSON.stringify(options.data),
      expiration: expirationMS !== 0 ? new Date().getTime() + expirationMS : null,
      hasExpiration: expirationMS !== 0 ? true : false
    }
    localStorage.setItem(options.key, JSON.stringify(record))
  }

  load(key: string) {
    // Get cached data from localstorage
    const item = localStorage.getItem(key)
    if (item !== null) {
      const record = JSON.parse(item)
      const now = new Date().getTime()
      // Expired data will return null
      if (!record || (record.hasExpiration && record.expiration <= now)) {
        return null
      } else {
        return JSON.parse(record.value)
      }
    }
    return null
  }

  remove(key: string) {
    localStorage.removeItem(key)
  }

  cleanLocalStorage() {
    localStorage.clear()
  }

  cleanUserRelatedData() {
    this.cleanCachedKeys([
      localStorageKeys.userLocalStorageConsent,
      localStorageKeys.userInfoOidc,
      localStorageKeys.personalTagsBookmarks,
      localStorageKeys.personalTagsSnippets,
      localStorageKeys.userHistoryBookmarks
    ]);
  }


  cleanCachedKeys(keys: string[]) {
    for (const key of keys) {
      localStorage.removeItem(key)
    }
  }

  cleanCachedKey(key: string) {
    localStorage.removeItem(key);
  }

  cleanCachedQueries(queries: any) {
    queries = Object.values(queries)

    for (const query of queries) {
      localStorage.removeItem(query)
    }
  }

}

export class LocalStorageSaveOptions {
  key: string
  data: any
  expirationHours?: number
}
