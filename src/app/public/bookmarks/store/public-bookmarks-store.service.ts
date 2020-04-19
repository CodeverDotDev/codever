import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Bookmark } from '../../../core/model/bookmark';
import { PublicBookmarksService } from '../public-bookmarks.service';
import { environment } from '../../../../environments/environment';

@Injectable()
export class PublicBookmarksStore {

  private _publicBookmarks: BehaviorSubject<Bookmark[]>;
  loadedPage: number;
  storeHasBeenFilled = false;

  constructor(private publicBookmarksService: PublicBookmarksService) {
    this.loadedPage = 1;
  }

  /**
   * The initial data is loaded either when the home page is requested (directly or via search parameters)
   */
  private loadDataFromBackend(page: number) {
    this.publicBookmarksService.getRecentPublicBookmarks(page, environment.PAGINATION_PAGE_SIZE)
      .subscribe(
        bookmarks => {
          this._publicBookmarks.next(bookmarks);
          this.loadedPage = page;
        },
        err => console.log('Error retrieving bookmarks')
      );
  }

  getRecentPublicBookmarks$(page: number): Observable<Bookmark[]> {
    if (this.loadedPage !== page || !this.storeHasBeenFilled) {
      if (!this._publicBookmarks) {
        this.storeHasBeenFilled = true;
        this._publicBookmarks = new BehaviorSubject([]);
      }
      this.loadDataFromBackend(page);
    }
    return this._publicBookmarks.asObservable();
  }

  addBookmarkToPublicStore(bookmark: Bookmark): void {
    if (this._publicBookmarks) {
      const publicBookmarks = this._publicBookmarks.getValue();
      publicBookmarks.unshift(bookmark);

      this._publicBookmarks.next(publicBookmarks);
    }
  }


  removeBookmarkFromPublicStore(deleted: Bookmark): void {
    if (this._publicBookmarks) {
      const bookmarks: Bookmark[] = this._publicBookmarks.getValue();
      const index = bookmarks.findIndex((bookmark) => bookmark._id === deleted._id);
      bookmarks.splice(index, 1);

      this._publicBookmarks.next(bookmarks);
    }
  }

  updateBookmarkInPublicStore(updated: Bookmark): void {
    if (this._publicBookmarks) {
      const bookmarks = this._publicBookmarks.getValue();
      const index = bookmarks.findIndex((bookmark: Bookmark) => bookmark._id === updated._id);
      bookmarks.splice(index, 1, updated);

      this._publicBookmarks.next(bookmarks);
    }
  }

}

