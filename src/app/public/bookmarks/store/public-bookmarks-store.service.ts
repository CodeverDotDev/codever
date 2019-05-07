import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { List } from 'immutable';
import { Bookmark } from '../../../core/model/bookmark';
import { PublicBookmarksService } from '../public-bookmarks.service';

@Injectable()
export class PublicBookmarksStore {

  private _publicBookmarks: BehaviorSubject<List<Bookmark>>;

  constructor(private publicBookmarksService: PublicBookmarksService) {
  }

  /**
   * The initial data is loaded either when the home page is requested (directly or via search parameters)
   */
  private loadInitialData() {
    this.publicBookmarksService.getRecentPublicBookmarks()
      .subscribe(
        res => {
          const bookmarks: Bookmark[] = <Bookmark[]>res;
          this._publicBookmarks.next(List(bookmarks));
        },
        err => console.log('Error retrieving bookmarks')
      );
  }

  getRecentPublicBookmarks(): Observable<List<Bookmark>> {
    if (!this._publicBookmarks) {
      this._publicBookmarks = new BehaviorSubject(List([]));
      this.loadInitialData();
    }
    return this._publicBookmarks.asObservable();
  }

  /**
   * Method called from PersonalBookmarkStore, when a user adds a new public bookmark.
   * @param bookmark
   */
  addBookmarkToPublicStore(bookmark: Bookmark): void {
    if (this._publicBookmarks) {
      this._publicBookmarks.next(this._publicBookmarks.getValue().unshift(bookmark));
    }
  }

  /**
   * Method is called from PersonalBookmarkStore, when the user removes a bookmark from there
   * @param deleted
   */
  removeBookmarkFromPublicStore(deleted: Bookmark): void {
    if (this._publicBookmarks) {
      const bookmarks: List<Bookmark> = this._publicBookmarks.getValue();
      const index = bookmarks.findIndex((bookmark) => bookmark._id === deleted._id);
      this._publicBookmarks.next(bookmarks.delete(index));
    }
  }

  /**
   *  Method is called from PersonalBookmarkStore, when the user updates the bookmark there
   *
   * @param updated
   */
  updateBookmarkInPublicStore(updated: Bookmark): void {
    if (this._publicBookmarks) {
      const bookmarks = this._publicBookmarks.getValue();
      const index = bookmarks.findIndex((bookmark: Bookmark) => bookmark._id === updated._id);
      this._publicBookmarks.next(bookmarks.set(index, updated));
    }
  }

}

