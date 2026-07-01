import { BehaviorSubject, Observable } from 'rxjs';

import { Injectable } from '@angular/core';

import { KeycloakService } from 'keycloak-angular';
import { UserDataService } from '../user-data.service';
import { Bookmark } from '../model/bookmark';
import { UserDataResource } from '../model/user-data-resource.type';
import { NotifyStoresService } from './notify-stores.service';
import { UserDataStore } from './userdata.store';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserDataPinnedStore {
  private _pinned: BehaviorSubject<UserDataResource[]> = new BehaviorSubject(null);
  private pinnedBookmarksHaveBeenLoaded = false;

  loadedPage: number;

  constructor(
    private userService: UserDataService,
    private userDataStore: UserDataStore,
    private keycloakService: KeycloakService,
    private notifyStoresService: NotifyStoresService
  ) {
    this.loadedPage = 1;
    this.notifyStoresService.bookmarkDeleted$.subscribe((bookmark) => {
      this.publishedPinnedAfterDeletion(bookmark);
    });
  }

  getPinnedResources$(
    userId: string,
    page: number,
    limit: number = environment.PAGINATION_PAGE_SIZE
  ): Observable<UserDataResource[]> {
    if (this.loadedPage !== page || !this.pinnedBookmarksHaveBeenLoaded) {
      this.userService
        .getPinnedResources(userId, page, limit)
        .subscribe((data) => {
          if (!this.pinnedBookmarksHaveBeenLoaded) {
            this.pinnedBookmarksHaveBeenLoaded = true;
          }
          this.pinnedBookmarksHaveBeenLoaded = true;
          this.loadedPage = page;
          this._pinned.next(data);
        });
    }
    return this._pinned.asObservable();
  }

  /**
   * Persists a new ordering for the currently shown pinned resources.
   * Only the displayed resources are reordered; any remaining pinned ids
   * (not shown in the quick-access panel) are appended afterwards.
   */
  reorderPinnedBookmarks(reorderedResources: UserDataResource[]) {
    this._pinned.next(reorderedResources);
    const reorderedIds = reorderedResources.map((resource) => resource._id);
    this.userDataStore.reorderUserDataPinned$(reorderedIds).subscribe();
  }

  addToPinned(resource: UserDataResource) {
    this.userDataStore.addToUserDataPinned$(resource).subscribe(() => {
      if (this.pinnedBookmarksHaveBeenLoaded) {
        const pinnedResources: UserDataResource[] = this._pinned.getValue();
        pinnedResources.unshift(resource);

        this._pinned.next(pinnedResources); // insert at the top (index 0)
      }
    });
  }

  removeFromPinned(resource: UserDataResource) {
    this.userDataStore.removeFromUserDataPinned$(resource).subscribe(() => {
      this.publishedPinnedAfterDeletion(resource);
    });
  }

  private publishedPinnedAfterDeletion(resource: UserDataResource) {
    if (this.pinnedBookmarksHaveBeenLoaded) {
      const pinnedResources: UserDataResource[] = this._pinned.getValue();
      const index = pinnedResources.findIndex(
        (pinnedResource) => resource._id === pinnedResource._id
      );
      if (index !== -1) {
        pinnedResources.splice(index, 1);
        this._pinned.next(pinnedResources);
      }
    }
  }

  public publishPinnedAfterCreation(bookmark: Bookmark) {
    if (this.pinnedBookmarksHaveBeenLoaded) {
      const pinned: UserDataResource[] = this._pinned.getValue();
      pinned.unshift(bookmark);
      this._pinned.next(pinned); // insert at the top (index 0)
    }
  }
}
