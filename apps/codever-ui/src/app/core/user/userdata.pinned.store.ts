import { BehaviorSubject, Observable } from 'rxjs';

import { Injectable } from '@angular/core';

import { KeycloakService } from 'keycloak-angular';
import { UserDataService } from '../user-data.service';
import { Bookmark } from '../model/bookmark';
import { NotifyStoresService } from './notify-stores.service';
import { UserDataStore } from './userdata.store';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserDataPinnedStore {
  private _pinned: BehaviorSubject<Bookmark[]> = new BehaviorSubject(null);
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

  getPinnedBookmarks$(
    userId: string,
    page: number,
    limit: number = environment.PAGINATION_PAGE_SIZE
  ): Observable<Bookmark[]> {
    if (this.loadedPage !== page || !this.pinnedBookmarksHaveBeenLoaded) {
      this.userService
        .getPinnedBookmarks(userId, page, limit)
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
   * Persists a new ordering for the currently shown pinned bookmarks.
   * Only the displayed bookmarks are reordered; any remaining pinned ids
   * (not shown in the quick-access panel) are appended afterwards.
   */
  reorderPinnedBookmarks(reorderedBookmarks: Bookmark[]) {
    this._pinned.next(reorderedBookmarks);
    const reorderedIds = reorderedBookmarks.map((bookmark) => bookmark._id);
    this.userDataStore.reorderUserDataPinned$(reorderedIds).subscribe();
  }


  addToPinnedBookmarks(bookmark: Bookmark) {
    this.userDataStore.addToUserDataPinned$(bookmark).subscribe(() => {
      if (this.pinnedBookmarksHaveBeenLoaded) {
        const pinnedBookmarks: Bookmark[] = this._pinned.getValue();
        pinnedBookmarks.unshift(bookmark);

        this._pinned.next(pinnedBookmarks); // insert at the top (index 0)
      }
    });
  }

  removeFromPinnedBookmarks(bookmark: Bookmark) {
    this.userDataStore.removeFromUserDataPinned$(bookmark).subscribe(() => {
      this.publishedPinnedAfterDeletion(bookmark);
    });
  }

  private publishedPinnedAfterDeletion(bookmark: Bookmark) {
    if (this.pinnedBookmarksHaveBeenLoaded) {
      const pinnedBookmarks: Bookmark[] = this._pinned.getValue();
      const index = pinnedBookmarks.findIndex(
        (pinnedBookmark) => bookmark._id === pinnedBookmark._id
      );
      if (index !== -1) {
        pinnedBookmarks.splice(index, 1);
        this._pinned.next(pinnedBookmarks);
      }
    }
  }

  public publishPinnedAfterCreation(bookmark: Bookmark) {
    if (this.pinnedBookmarksHaveBeenLoaded) {
      const pinned: Bookmark[] = this._pinned.getValue();
      pinned.unshift(bookmark);
      this._pinned.next(pinned); // insert at the top (index 0)
    }
  }
}
