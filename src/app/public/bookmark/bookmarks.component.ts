import {Component, OnInit} from "@angular/core";
import {Observable} from "rxjs";
import {BookmarkStore} from "./store/BookmarkStore";
import {List} from "immutable";
import {Bookmark} from "../../core/model/bookmark";
import {Tag} from "../../core/model/tags";


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

          this.tags.push(new Tag(tag.toString(), tagBookmarks));
        });
      },
      err => {
        console.log("Error filtering bookmakrs");
      }
    );
  }

}
