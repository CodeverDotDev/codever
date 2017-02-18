
import {Injectable} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";
import {List} from "immutable";
import {BookmarkService} from "../bookmark.service";
import {Bookmark} from "../../model/bookmark";
import {Logger} from "../../logger.service";

@Injectable()
export class BookmarkStore {

    private _bookmarks: BehaviorSubject<List<Bookmark>> = new BehaviorSubject(List([]))

    constructor(private bookmarkService: BookmarkService, private logger:Logger) {
        this.loadInitialData();
    }

    private loadInitialData() {
        this.bookmarkService.getAllBookmarks()
            .subscribe(
                res => {
                  console.log('Response to JSON:');
                  console.log(res.json());
                  let bookmarks = (<Object[]>res.json())
                    .map((bookmark: any) =>
                      new Bookmark(
                          bookmark.name,
                          bookmark.location,
                          bookmark.category,
                          bookmark.tags,
                          bookmark.description,
                          bookmark._id
                      )
                    );

                  this._bookmarks.next(List(bookmarks));
                },
                err => console.log("Error retrieving bookmarks")
            );
    }

  getBookmarks():Observable<List<Bookmark>> {
    return this._bookmarks.asObservable();
  }

  getBookmarksValue():List<Bookmark> {
    return this._bookmarks.getValue();
  }

  addBookmark(newBookmark:Bookmark): void {
    this._bookmarks.next(this._bookmarks.getValue().push(newBookmark));
  }

  removeFromStore(deleted: Bookmark): void {
    let bookmarks: List<Bookmark> = this._bookmarks.getValue();
    let index = bookmarks.findIndex((bookmark) => bookmark._id === deleted._id);
    this._bookmarks.next(bookmarks.delete(index));
  }

  updateBookmark(updated:Bookmark): void {
    let bookmarks = this._bookmarks.getValue();
    let index = bookmarks.findIndex((bookmark: Bookmark) => bookmark._id === updated._id);
    //let bookmark:Bookmark = bookmarks.get(index);
    this._bookmarks.next(bookmarks.set(index, updated));
  }

}

