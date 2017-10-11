
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {List} from 'immutable';
import {Bookmark} from '../../../core/model/bookmark';
import {BookmarkService} from '../bookmark.service';

@Injectable()
export class BookmarkStore {

    private _bookmarks: BehaviorSubject<List<Bookmark>>;

    constructor(private bookmarkService: BookmarkService) {}

  /**
   * The initial data is loaded either when the home page is requested (directly or via search parameters)
   */
  private loadInitialData() {
        this.bookmarkService.getAllBookmarks()
            .subscribe(
                res => {
                  console.log('Response to JSON:');
                  console.log(res.json());
                  const bookmarks = (<Object[]>res.json())
                    .map((bookmark: any) =>
                      new Bookmark(
                          bookmark.name,
                          bookmark.location,
                          bookmark.language,
                          bookmark.category,
                          bookmark.tags,
                          bookmark.publishedOn,
                          bookmark.githubURL,
                          bookmark.description,
                          bookmark.descriptionHtml,
                          bookmark._id,
                          '',
                          bookmark.userId,
                          bookmark.shared,
                          bookmark.createdAt,
                          bookmark.updatedAt,
                          bookmark.starredBy
                      )
                    );

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

