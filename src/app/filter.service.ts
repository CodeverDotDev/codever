
import {Injectable} from "@angular/core";
import {Bookmark} from "./model/bookmark";
import {List} from "immutable";
import {Observable} from "rxjs";

@Injectable()
export class BookmarkFilterService {

  filterBookmarksBySearchTerm(query:string, observableListBookmark:Observable<List<Bookmark>>): Observable<Bookmark[]> {
    var terms = query.split("+");
    let result = Observable.of<Bookmark[]>([]);
    observableListBookmark.subscribe(
      bookmarks => {
        let filteredBookmarks = bookmarks;
        terms.forEach(term => {
          filteredBookmarks = filteredBookmarks.filter(x => this.bookmarkContainsTerm(x, term.trim())).toList();
        });

        result = Observable.of(filteredBookmarks.toArray());
      },
      err => {
        console.log("Error filtering bookmakrs");
      }
    );

    return result;
  }


  private bookmarkContainsTerm(bookmark: Bookmark, term: string):boolean {
    let hit:boolean =false;
    if(bookmark.name.toLowerCase().indexOf(term.toLowerCase()) !== -1
      || bookmark.description.toLowerCase().indexOf(term.toLowerCase()) !== -1
      || bookmark.tags.indexOf(term.toLowerCase()) !== -1
    ){
      return true;
    }

    //if not hit look throught the tags also
    bookmark.tags.forEach(tag => {
      if(tag.indexOf(term.toLowerCase()) !== -1){
        return true;
      }
    });

    return false;
  }
}
