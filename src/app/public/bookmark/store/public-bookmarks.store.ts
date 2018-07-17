
import {Injectable} from '@angular/core';
import {Observable, BehaviorSubject} from 'rxjs';
import {List} from 'immutable';
import {Bookmark} from '../../../core/model/bookmark';
import {PublicBookmarksService} from '../public-bookmarks.service';

@Injectable()
export class PublicBookmarksStore {

    private _bookmarks: BehaviorSubject<List<Bookmark>>;

    constructor(private bookmarkService: PublicBookmarksService) {}

  /**
   * The initial data is loaded either when the home page is requested (directly or via search parameters)
   */
  private loadInitialData() {
        this.bookmarkService.getAllBookmarks()
            .subscribe(
                res => {
                  const bookmarks: Bookmark[] = <Bookmark[]>res;
                  this._bookmarks.next(List(bookmarks));
                },
                err => console.log('Error retrieving bookmarks')
            );
    }

  getBookmarks(): Observable<List<Bookmark>> {
    if (!this._bookmarks) {
      this._bookmarks = new BehaviorSubject(List([]));
      this.loadInitialData();
    }
    return this._bookmarks.asObservable();
  }

  /**
   * Method called from PersonalBookmarkStore, when a user adds a new public bookmark.
   * @param newBookmark
   */
  addBookmark(newBookmark: Bookmark): void {
    if (this._bookmarks) {
      this._bookmarks.next(this._bookmarks.getValue().push(newBookmark));
    }
  }

  /**
   * Method is called from PersonalBookmarkStore, when the user removes a bookmark from there
   * @param deleted
   */
  removeFromPublicStore(deleted: Bookmark): void {
      if (this._bookmarks) {
        const bookmarks: List<Bookmark> = this._bookmarks.getValue();
        const index = bookmarks.findIndex((bookmark) => bookmark._id === deleted._id);
        this._bookmarks.next(bookmarks.delete(index));
      }
  }

  /**
   *  Method is called from PersonalBookmarkStore, when the user updates the bookmark there
   *
   * @param updated
   */
  updateBookmark(updated: Bookmark): void {
    if (this._bookmarks) {
      const bookmarks = this._bookmarks.getValue();
      const index = bookmarks.findIndex((bookmark: Bookmark) => bookmark._id === updated._id);
      // let bookmark:Bookmark = bookmarks.get(index);
      this._bookmarks.next(bookmarks.set(index, updated));
    }
  }

}

