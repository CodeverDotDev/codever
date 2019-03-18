
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
   * Method called from PersonalBookmarkStore, when a user adds a new public codingmark.
   * @param codingmark
   */
  addCodingmarkToPublicStore(codingmark: Bookmark): void {
    if (this._publicCodingmarks) {
      this._publicCodingmarks.next(this._publicCodingmarks.getValue().push(codingmark));
    }
  }

  /**
   * Method is called from PersonalBookmarkStore, when the user removes a codingmark from there
   * @param deleted
   */
  removeCodingmarkFromPublicStore(deleted: Bookmark): void {
      if (this._publicCodingmarks) {
        const codingmarks: List<Bookmark> = this._publicCodingmarks.getValue();
        const index = codingmarks.findIndex((codingmark) => codingmark._id === deleted._id);
        this._publicCodingmarks.next(codingmarks.delete(index));
      }
  }

  /**
   *  Method is called from PersonalBookmarkStore, when the user updates the codingmark there
   *
   * @param updated
   */
  updateCodingmarkInPublicStore(updated: Bookmark): void {
    if (this._publicCodingmarks) {
      const codingmarks = this._publicCodingmarks.getValue();
      const index = codingmarks.findIndex((codingmark: Bookmark) => codingmark._id === updated._id);
      // let codingmark:codingmark = codingmarks.get(index);
      this._publicCodingmarks.next(codingmarks.set(index, updated));
    }
  }

}

