import {Component, OnInit} from "@angular/core";
import {Bookmark} from "../model/bookmark";
import {Observable} from "rxjs";
import {BookmarkStore} from "./store/BookmarkStore";
import {List} from "immutable";
import {Tag} from "../model/tags";

@Component({
  selector: 'my-bookmarks',
  templateUrl: './bookmarks.component.html',
  styleUrls: ['./bookmarks.component.scss']
})
export class BookmarksComponent implements  OnInit{

  publicBookmarks: Observable<List<Bookmark>>;
  tags: Tag[] = [];

  constructor(private bookmarkStore: BookmarkStore) { }

  getBookmarks(): void {
    this.publicBookmarks = this.bookmarkStore.getBookmarks();
  }

  ngOnInit(): void {
    this.getBookmarks();

    this.publicBookmarks.subscribe(
      bookmarks => {
        let allTags = new Set();

        bookmarks.forEach(bookmark => {
          //allTags.merge(allTags, OrderedSet.fromKeys(bookmark.tags));
          bookmark.tags.forEach(tag => {
            allTags = allTags.add(tag.trim().toLowerCase());
          });
        });


        console.log("all TAgs array");
        console.log(Array.from(allTags).sort());

        Array.from(allTags).sort().forEach(tag => {
          let tagBookmarks = [];
          bookmarks.forEach(bookmark => {
            bookmark.tags.forEach(bookmarkTag => {
              if(bookmarkTag.trim().toLowerCase() === tag){
                tagBookmarks.push(bookmark);
              }
            });
          });
          this.tags.push(new Tag(tag, tagBookmarks));
        });
      },
      err => {
        console.log("Error filtering bookmakrs");
      }
    );



    /**/
    /*
    //now iterated through all tags and build the tags[] list
    let map = allTags.map(x => {
      let bookmarksWithTag = [];
      bookmarks.forEach(bookmark => {
        if(bookmark.tags.indexOf(x.toLowerCase()) !== -1){
          bookmarksWithTag.push(bookmark);
        }
      });

      return new Tag(x, bookmarksWithTag);
    });
    */
  }

}
