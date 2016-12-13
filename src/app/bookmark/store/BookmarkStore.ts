
import {Injectable} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";
import {List} from 'immutable';
import {BookmarkService} from "../bookmark.service";
import {Bookmark} from "../../model/bookmark";
import {Logger} from "../../logger.service";
import {ErrorService} from "../../error/error.service";
import {Response} from "@angular/http";

@Injectable()
export class BookmarkStore {

    private _bookmarks: BehaviorSubject<List<Bookmark>> = new BehaviorSubject(List([]))

    constructor(private bookmarkService: BookmarkService, private logger:Logger, private errorService: ErrorService) {
        this.logger.log('******** BookmarkStore constructor was called *************');
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

  filterBookmarksBySearchTerm(term:string): Bookmark[] {
    let bookmarks: List<Bookmark> = this._bookmarks.getValue();
    let filteredBookmarks: Array<Bookmark> = new Array();
    bookmarks.forEach(bookmark => {
      let hit:boolean =false;
      if(bookmark.name.toLowerCase().indexOf(term.toLowerCase()) !== -1
        || bookmark.description.toLowerCase().indexOf(term.toLowerCase()) !== -1
        || bookmark.category.toLowerCase().indexOf(term.toLowerCase()) !== -1
        || bookmark.tags.indexOf(term.toLowerCase()) !== -1
      ){
        filteredBookmarks.push(bookmark);
        hit = true;
      }

      //if not hit look throught the tags also
      let hitInTags: boolean = false;
      if(!hit){
        bookmark.tags.forEach(tag => {
          if(tag.indexOf(term.toLowerCase()) !== -1){
            hitInTags = true;
          }
        });
      }

      if(!hit && hitInTags){
        filteredBookmarks.push(bookmark);
      }
    });

    let  filteredBookmarksArray: Array<Array<Bookmark>> = new Array();
    filteredBookmarksArray.push(filteredBookmarks);

    console.log('I have been here, size ' + filteredBookmarks.length);

    return filteredBookmarks;
  }

}

