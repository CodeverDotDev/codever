
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
                  const codingmarks: Codingmark[] = <Codingmark[]>res;
                  this._publicCodingmarks.next(List(codingmarks));
                },
                err => console.log('Error retrieving codingmarks')
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
   * Method called from PersonalBookmarkStore, when a user adds a new public codingmark.
   * @param newBookmark
   */
  addBookmark(newBookmark: Codingmark): void {
    if (this._publicCodingmarks) {
      this._publicCodingmarks.next(this._publicCodingmarks.getValue().push(newBookmark));
    }
  }

  /**
   * Method is called from PersonalBookmarkStore, when the user removes a codingmark from there
   * @param deleted
   */
  removeFromPublicStore(deleted: Codingmark): void {
      if (this._publicCodingmarks) {
        const codingmarks: List<Codingmark> = this._publicCodingmarks.getValue();
        const index = codingmarks.findIndex((codingmark) => codingmark._id === deleted._id);
        this._publicCodingmarks.next(codingmarks.delete(index));
      }
  }

  /**
   *  Method is called from PersonalBookmarkStore, when the user updates the codingmark there
   *
   * @param updated
   */
  updateBookmark(updated: Codingmark): void {
    if (this._publicCodingmarks) {
      const codingmarks = this._publicCodingmarks.getValue();
      const index = codingmarks.findIndex((codingmark: Codingmark) => codingmark._id === updated._id);
      // let codingmark:codingmark = codingmarks.get(index);
      this._publicCodingmarks.next(codingmarks.set(index, updated));
    }
  }

}

