
import {Injectable} from "@angular/core";
import {Bookmark} from "./model/bookmark";
import {List} from "immutable";

@Injectable()
export class BookmarkFilterService {

  filterBookmarksBySearchTerm(term:string, bookmarks:List<Bookmark>): Bookmark[] {
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
