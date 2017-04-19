
import {Injectable} from "@angular/core";
import {Bookmark} from "./model/bookmark";
import {List} from "immutable";
import {Observable} from "rxjs";

@Injectable()
export class BookmarkFilterService {

  /**
   * Filters a list of bookmarks based on the query string.
   *
   * Tags are enclosed in square brackets - e.g [angular]. The filter is now permissive, that is when starting with
   * "[" the filter assumes that the tag is what comes after even though there is no enclosing "]". That is now to support
   * the autosearch feature
   *
   * @param query - is a string of search terms; multiple terms are separated via the "+" sign
   * @param observableListBookmark - the list to be filtered
   * @returns {any} - the filtered list
   */
  filterBookmarksBySearchTerm(query:string, observableListBookmark:Observable<List<Bookmark>>): Bookmark[] {
    var terms = query.split(" ");
    let result:Bookmark[] = [];
    observableListBookmark.subscribe(
      bookmarks => {
        let filteredBookmarks = bookmarks.toArray(); //we start with all bookmarks
        terms.forEach(term => {
          if(term.substring(0,1) === '['){
            let matches = term.match(/\[(.*?)\]/);
            if (matches) {
              let tag = matches[1];
              filteredBookmarks = filteredBookmarks.filter(x => this.bookmarkContainsTag(x, tag.trim()));
            } else {
              filteredBookmarks = filteredBookmarks.filter(x => this.bookmarkContainsTag(x, term.substring(1, term.length).trim()));
            }
          } else {
            filteredBookmarks = filteredBookmarks.filter(x => this.bookmarkContainsTerm(x, term.trim()));
          }
        });

        result = filteredBookmarks;
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
    let result: boolean = false;
    if(bookmark.name.toLowerCase().indexOf(term.toLowerCase()) !== -1
      || bookmark.location.toLowerCase().indexOf(term.toLowerCase()) !== -1
      || bookmark.description.toLowerCase().indexOf(term.toLowerCase()) !== -1
      || bookmark.tags.indexOf(term.toLowerCase()) !== -1
    ){
      result=true;
    }

    if(result) {
      return true;
    } else {
      //if not found already look through the tags also
      bookmark.tags.forEach(tag => {
        if(tag.toLowerCase().indexOf(term.toLowerCase()) !== -1){
          result= true;
        }
      });
    }


    return result;
  }

  private bookmarkContainsTag(bookmark: Bookmark, tag: string):boolean {
    let result: boolean = false;
    bookmark.tags.forEach(bookmarkTag => {
      if(bookmarkTag.toLowerCase().indexOf(tag.toLowerCase()) !== -1){
        result = true;
      }
    });

    return result;
  }

}
