import { BehaviorSubject, Observable } from 'rxjs';

import { Injectable } from '@angular/core';

import { AuthenticationService } from '../auth/authentication.service';
import { UserDataService } from '../user-data.service';
import { Bookmark } from '../model/bookmark';
import { Collection, toPinnedCollection } from '../model/collection';
import { UserDataResource } from '../model/user-data-resource.type';
import { NotifyStoresService } from './notify-stores.service';
import { UserDataStore } from './userdata.store';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserDataPinnedStore {
  // Cache each user/page/limit separately so home-page pagination cannot
  // replace the larger pinned list used by quick access and its dialog.
  private readonly pinnedPages = new Map<string, PinnedPage>();

  constructor(
    private userService: UserDataService,
    private userDataStore: UserDataStore,
    private keycloakService: AuthenticationService,
    private notifyStoresService: NotifyStoresService
  ) {
    this.notifyStoresService.bookmarkDeleted$.subscribe((bookmark) => {
      this.publishedPinnedAfterDeletion(bookmark);
    });
  }

  getPinnedResources$(
    userId: string,
    page: number,
    limit: number = environment.PAGINATION_PAGE_SIZE
  ): Observable<UserDataResource[]> {
    const cacheKey = `${userId}:${page}:${limit}`;
    let pinnedPage = this.pinnedPages.get(cacheKey);
    if (!pinnedPage) {
      pinnedPage = { page, limit, resources$: new BehaviorSubject(null) };
      this.pinnedPages.set(cacheKey, pinnedPage);
    }

    if (!pinnedPage.loaded) {
      this.userService
        .getPinnedResources(userId, page, limit)
        .subscribe((data) => {
          pinnedPage.loaded = true;
          pinnedPage.resources$.next(data);
        });
    }
    return pinnedPage.resources$.asObservable();
  }

  /**
   * Persists a new ordering for the currently shown pinned resources.
   * Only the displayed resources are reordered; any remaining pinned ids
   * (not shown in the quick-access panel) are appended afterwards.
   */
  reorderPinnedBookmarks(reorderedResources: UserDataResource[]) {
    this.pinnedPages.forEach((pinnedPage) => {
      if (pinnedPage.loaded && pinnedPage.page === 1) {
        pinnedPage.resources$.next(
          reorderedResources.slice(0, pinnedPage.limit)
        );
      }
    });
    this.userDataStore
      .reorderUserDataPinned$(reorderedResources)
      .subscribe();
  }

  addToPinned(resource: UserDataResource) {
    this.userDataStore.addToUserDataPinned$(resource).subscribe(() => {
      this.publishPinnedAtTop(resource);
    });
  }

  removeFromPinned(resource: UserDataResource) {
    this.userDataStore.removeFromUserDataPinned$(resource).subscribe(() => {
      this.publishedPinnedAfterDeletion(resource);
    });
  }

  /** Pins a collection, projecting it into the light pinned shape. */
  addCollectionToPinned(collection: Collection) {
    const pinnedCollection = toPinnedCollection(collection);
    this.userDataStore
      .addToUserDataPinned$(pinnedCollection)
      .subscribe(() => {
        this.publishPinnedAtTop(pinnedCollection);
      });
  }

  /** Unpins a collection. */
  removeCollectionFromPinned(collection: Collection) {
    const pinnedCollection = toPinnedCollection(collection);
    this.userDataStore
      .removeFromUserDataPinned$(pinnedCollection)
      .subscribe(() => {
        this.publishedPinnedAfterDeletion(pinnedCollection);
      });
  }

  private publishedPinnedAfterDeletion(resource: UserDataResource) {
    this.pinnedPages.forEach((pinnedPage) => {
      if (pinnedPage.loaded) {
        const pinnedResources = pinnedPage.resources$.getValue() || [];
        const index = pinnedResources.findIndex(
          (pinnedResource) => resource._id === pinnedResource._id
        );
        if (index !== -1) {
          pinnedResources.splice(index, 1);
          pinnedPage.resources$.next(pinnedResources);
        }
      }
    });
  }

  public publishPinnedAfterCreation(bookmark: Bookmark) {
    this.publishPinnedAtTop(bookmark);
  }

  private publishPinnedAtTop(resource: UserDataResource) {
    // A new pin belongs at the front of page 1, but not on later pages.
    this.pinnedPages.forEach((pinnedPage) => {
      if (pinnedPage.loaded && pinnedPage.page === 1) {
        const pinnedResources = pinnedPage.resources$.getValue() || [];
        const withoutResource = pinnedResources.filter(
          (pinnedResource) => pinnedResource._id !== resource._id
        );
        pinnedPage.resources$.next(
          [resource, ...withoutResource].slice(0, pinnedPage.limit)
        );
      }
    });
  }
}

interface PinnedPage {
  page: number;
  limit: number;
  resources$: BehaviorSubject<UserDataResource[]>;
  loaded?: boolean;
}
