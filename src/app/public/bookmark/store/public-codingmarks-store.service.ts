
import {Injectable} from '@angular/core';
import {Observable, BehaviorSubject} from 'rxjs';
import {List} from 'immutable';
import {Bookmark} from '../../../core/model/bookmark';
import {PublicCodingmarksService} from '../public-codingmarks.service';

@Injectable()
export class PublicCodingmarksStore {

    private _publicCodingmarks: BehaviorSubject<List<Bookmark>>;

    constructor(private publicCodingmarksService: PublicCodingmarksService) {}

  /**
   * The initial data is loaded either when the home page is requested (directly or via search parameters)
   */
  private loadInitialData() {
        this.publicCodingmarksService.getAllPublicCodingmarks()
            .subscribe(
                res => {
                  const bookmarks: Bookmark[] = <Bookmark[]>res;
                  this._publicCodingmarks.next(List(bookmarks));
                },
                err => console.log('Error retrieving bookmarks')
            );
    }

  getBookmarks(): Observable<List<Bookmark>> {
    if (!this._publicCodingmarks) {
      this._publicCodingmarks = new BehaviorSubject(List([]));
      this.loadInitialData();
    }
    return this._publicCodingmarks.asObservable();
  }

  /**
   * Method called from PersonalBookmarkStore, when a user adds a new public bookmark.
   * @param newBookmark
   */
  addBookmark(newBookmark: Bookmark): void {
    if (this._publicCodingmarks) {
      this._publicCodingmarks.next(this._publicCodingmarks.getValue().push(newBookmark));
    }
  }

  /**
   * Method is called from PersonalBookmarkStore, when the user removes a bookmark from there
   * @param deleted
   */
  removeFromPublicStore(deleted: Bookmark): void {
      if (this._publicCodingmarks) {
        const bookmarks: List<Bookmark> = this._publicCodingmarks.getValue();
        const index = bookmarks.findIndex((bookmark) => bookmark._id === deleted._id);
        this._publicCodingmarks.next(bookmarks.delete(index));
      }
  }

  /**
   *  Method is called from PersonalBookmarkStore, when the user updates the bookmark there
   *
   * @param updated
   */
  updateBookmark(updated: Bookmark): void {
    if (this._publicCodingmarks) {
      const bookmarks = this._publicCodingmarks.getValue();
      const index = bookmarks.findIndex((bookmark: Bookmark) => bookmark._id === updated._id);
      // let bookmark:Bookmark = bookmarks.get(index);
      this._publicCodingmarks.next(bookmarks.set(index, updated));
    }
  }

}

