
import {Injectable} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";
import {List} from 'immutable';
import {BookmarkService} from "../bookmark.service";
import {Bookmark} from "../bookmark";

@Injectable()
export class BookmarkStore {

    private _bookmarks: BehaviorSubject<List<Bookmark>> = new BehaviorSubject(List([]))

    constructor(private bookmarkService: BookmarkService) {
        this.loadInitialData();
    }

    private loadInitialData() {
        this.bookmarkService.getBookmarks()
            .subscribe(
                res => {
                    this._bookmarks.next(List(res));
                },
                err => console.log("Error retrieving bookmarks")
            );
    }

    get bookmarks(){
        return this._bookmarks.asObservable();
    }

  addBookmark(newBookmark:Bookmark):Observable<List<Bookmark>> {

    let obs = this.bookmarkService.saveBookmark(newBookmark);

    obs.subscribe(
      res => {
        this._bookmarks.next(this._bookmarks.getValue().push(newBookmark));
      });

    return obs;
  }

  deleteBookmark(deleted: Bookmark): Observable<any> {
    let obs: Observable<any> = this.bookmarkService.delete(deleted._id);

    obs.subscribe(
      res =>  {
        let bookmarks: List<Bookmark> = this._bookmarks.getValue();
        let index = bookmarks.findIndex((bookmark) => bookmark._id === deleted._id);
        this._bookmarks.next(bookmarks.delete(index));
      }
    );

    return obs;
  }
}

