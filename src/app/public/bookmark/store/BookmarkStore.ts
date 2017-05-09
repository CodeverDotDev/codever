
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {List} from 'immutable';
import {Bookmark} from '../../../core/model/bookmark';
import {BookmarkService} from '../bookmark.service';

@Injectable()
export class BookmarkStore {

    private _bookmarks: BehaviorSubject<List<Bookmark>> = new BehaviorSubject(List([]));

    constructor(private bookmarkService: BookmarkService) {
        this.loadInitialData();
    }

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
                          bookmark.category,
                          bookmark.tags,
                          bookmark.publishedOn,
                          bookmark.githubURL,
                          bookmark.description,
                          bookmark.descriptionHtml,
                          bookmark._id
                      )
                    );

                  this._bookmarks.next(List(bookmarks));
                },
                err => console.log('Error retrieving bookmarks')
            );
    }

  getBookmarks(): Observable<List<Bookmark>> {
    return this._bookmarks.asObservable();
  }

  getBookmarksValue(): List<Bookmark> {
    return this._bookmarks.getValue();
  }

  addBookmark(newBookmark: Bookmark): void {
    this._bookmarks.next(this._bookmarks.getValue().push(newBookmark));
  }

  removeFromStore(deleted: Bookmark): void {
    const bookmarks: List<Bookmark> = this._bookmarks.getValue();
    const index = bookmarks.findIndex((bookmark) => bookmark._id === deleted._id);
    this._bookmarks.next(bookmarks.delete(index));
  }

  updateBookmark(updated: Bookmark): void {
    const bookmarks = this._bookmarks.getValue();
    const index = bookmarks.findIndex((bookmark: Bookmark) => bookmark._id === updated._id);
    // let bookmark:Bookmark = bookmarks.get(index);
    this._bookmarks.next(bookmarks.set(index, updated));
  }

}

