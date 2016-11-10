
import {Injectable} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";
import {List} from 'immutable';
import {BookmarkService} from "../bookmark.service";
import {Bookmark} from "../bookmark";
import {Logger} from "../../logger.service";

@Injectable()
export class BookmarkStore {

    private _bookmarks: BehaviorSubject<List<Bookmark>> = new BehaviorSubject(List([]))

    constructor(private bookmarkService: BookmarkService, private logger:Logger) {
        this.logger.log('******** BookmarkStore constructor was called *************');
        this.loadInitialData();
    }

    private loadInitialData() {
        this.bookmarkService.getAllBookmarks()
            .subscribe(
                res => {
                  console.log('Response to jSOOooon');
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

                  console.log('BOOKmarks');
                  console.log(bookmarks);
                  this._bookmarks.next(List(bookmarks));
                },
                err => console.log("Error retrieving bookmarks")
            );
    }

    getBookmarks():Observable<List<Bookmark>> {
        return this._bookmarks.asObservable();
    }

  get bookmarks() {
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

  updateBookmark(updated:Bookmark): Observable<any> {
    let obs: Observable<any> = this.bookmarkService.updateBookmark(updated);

    obs.subscribe(
      res => {
        let bookmarks = this._bookmarks.getValue();
        let index = bookmarks.findIndex((bookmark: Bookmark) => bookmark._id === updated._id);
        //let bookmark:Bookmark = bookmarks.get(index);
        this._bookmarks.next(bookmarks.set(index, updated));
      }
    );

    return obs;
  }


   filterBookmarksBySearchTerm(term:string): Observable<Bookmark[]> {
    let bookmarks: List<Bookmark> = this._bookmarks.getValue();
    let filteredBookmarks: Array<Bookmark> = new Array();
    bookmarks.forEach(bookmark => {
      if(bookmark.name.indexOf(term) !== -1){
        filteredBookmarks.push(bookmark);
      }
    });

     let  filteredBookmarksArray: Array<Array<Bookmark>> = new Array();
     filteredBookmarksArray.push(filteredBookmarks);

     console.log('I have been here, size ' + filteredBookmarks.length);
      //return Observable.from(filteredBookmarksArray);
      return Observable.of(filteredBookmarks);
   }

    /*
    return this._bookmarks.asObservable()
      .map(bookmarkList => bookmarkList.name.indexOf(term) !== -1);
      */

}

