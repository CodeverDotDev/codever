
import {Injectable} from "@angular/core";
import {Bookmark} from "./model/bookmark";
import {List} from "immutable";
import {Observable} from "rxjs";

@Injectable()
export class BookmarkFilterService {

  /**
   * Filters a list of bookmarks based on the query string.
   * @param query - is a string of search terms; multiple terms are separated via the "+" sign
   * @param observableListBookmark - the list to be filtered
   * @returns {any} - the filtered list
   */
  filterBookmarksBySearchTerm(query:string, observableListBookmark:Observable<List<Bookmark>>): Observable<Bookmark[]> {
    var terms = query.split("+");
    let result = Observable.of<Bookmark[]>([]);
    observableListBookmark.subscribe(
      bookmarks => {
        let filteredBookmarks = bookmarks; //we start with all bookmarks
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

  /**
   * Checks if one search term is present in the bookmark's metadata (name, location, description, tags)
   *
   * @param bookmark
   * @param term
   * @returns {boolean}
   */
  private bookmarkContainsTerm(bookmark: Bookmark, term: string):boolean {
    if(bookmark.name.toLowerCase().indexOf(term.toLowerCase()) !== -1
      || bookmark.location.toLowerCase().indexOf(term.toLowerCase()) !== -1
      || bookmark.description.toLowerCase().indexOf(term.toLowerCase()) !== -1
      || bookmark.tags.indexOf(term.toLowerCase()) !== -1
    ){
      return true;
    }

    //if not found already look through the tags also
    bookmark.tags.forEach(tag => {
      if(tag.indexOf(term.toLowerCase()) !== -1){
        return true;
      }
    });

    return false;
  }
}
