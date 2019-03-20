
import {Injectable} from '@angular/core';
import {Observable, BehaviorSubject} from 'rxjs';
import {List} from 'immutable';
import {Bookmark} from '../../../core/model/bookmark';
import {PublicBookmarksService} from '../public-bookmarks.service';

@Injectable()
export class PublicBookmarksStore {

    private _publicCodingmarks: BehaviorSubject<List<Bookmark>>;

    constructor(private publicCodingmarksService: PublicBookmarksService) {}

  /**
   * The initial data is loaded either when the home page is requested (directly or via search parameters)
   */
  private loadInitialData() {
        this.publicCodingmarksService.getAllPublicCodingmarks()
            .subscribe(
                res => {
                  const codingmarks: Bookmark[] = <Bookmark[]>res;
                  this._publicCodingmarks.next(List(codingmarks));
                },
                err => console.log('Error retrieving codingmarks')
            );
    }

  getPublicCodingmarks(): Observable<List<Bookmark>> {
    if (!this._publicCodingmarks) {
      this._publicCodingmarks = new BehaviorSubject(List([]));
      this.loadInitialData();
    }
    return this._publicCodingmarks.asObservable();
  }

  /**
   * Method called from PersonalBookmarkStore, when a user adds a new public bookmark.
   * @param bookmark
   */
  addCodingmarkToPublicStore(bookmark: Bookmark): void {
    if (this._publicCodingmarks) {
      this._publicCodingmarks.next(this._publicCodingmarks.getValue().push(bookmark));
    }
  }

  /**
   * Method is called from PersonalBookmarkStore, when the user removes a bookmark from there
   * @param deleted
   */
  removeCodingmarkFromPublicStore(deleted: Bookmark): void {
      if (this._publicCodingmarks) {
        const codingmarks: List<Bookmark> = this._publicCodingmarks.getValue();
        const index = codingmarks.findIndex((bookmark) => bookmark._id === deleted._id);
        this._publicCodingmarks.next(codingmarks.delete(index));
      }
  }

  /**
   *  Method is called from PersonalBookmarkStore, when the user updates the bookmark there
   *
   * @param updated
   */
  updateCodingmarkInPublicStore(updated: Bookmark): void {
    if (this._publicCodingmarks) {
      const codingmarks = this._publicCodingmarks.getValue();
      const index = codingmarks.findIndex((bookmark: Bookmark) => bookmark._id === updated._id);
      // let bookmark:bookmark = codingmarks.get(index);
      this._publicCodingmarks.next(codingmarks.set(index, updated));
    }
  }

}

