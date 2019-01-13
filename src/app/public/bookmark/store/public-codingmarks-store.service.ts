
import {Injectable} from '@angular/core';
import {Observable, BehaviorSubject} from 'rxjs';
import {List} from 'immutable';
import {Codingmark} from '../../../core/model/codingmark';
import {PublicCodingmarksService} from '../public-codingmarks.service';

@Injectable()
export class PublicCodingmarksStore {

    private _publicCodingmarks: BehaviorSubject<List<Codingmark>>;

    constructor(private publicCodingmarksService: PublicCodingmarksService) {}

  /**
   * The initial data is loaded either when the home page is requested (directly or via search parameters)
   */
  private loadInitialData() {
        this.publicCodingmarksService.getAllPublicCodingmarks()
            .subscribe(
                res => {
                  const bookmarks: Codingmark[] = <Codingmark[]>res;
                  this._publicCodingmarks.next(List(bookmarks));
                },
                err => console.log('Error retrieving bookmarks')
            );
    }

  getBookmarks(): Observable<List<Codingmark>> {
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
  addBookmark(newBookmark: Codingmark): void {
    if (this._publicCodingmarks) {
      this._publicCodingmarks.next(this._publicCodingmarks.getValue().push(newBookmark));
    }
  }

  /**
   * Method is called from PersonalBookmarkStore, when the user removes a bookmark from there
   * @param deleted
   */
  removeFromPublicStore(deleted: Codingmark): void {
      if (this._publicCodingmarks) {
        const bookmarks: List<Codingmark> = this._publicCodingmarks.getValue();
        const index = bookmarks.findIndex((bookmark) => bookmark._id === deleted._id);
        this._publicCodingmarks.next(bookmarks.delete(index));
      }
  }

  /**
   *  Method is called from PersonalBookmarkStore, when the user updates the bookmark there
   *
   * @param updated
   */
  updateBookmark(updated: Codingmark): void {
    if (this._publicCodingmarks) {
      const bookmarks = this._publicCodingmarks.getValue();
      const index = bookmarks.findIndex((bookmark: Codingmark) => bookmark._id === updated._id);
      // let bookmark:Bookmark = bookmarks.get(index);
      this._publicCodingmarks.next(bookmarks.set(index, updated));
    }
  }

}

