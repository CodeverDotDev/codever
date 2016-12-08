import {Component, OnInit} from "@angular/core";
import {Bookmark} from "../model/bookmark";
import {Observable} from "rxjs";
import {BookmarkStore} from "./store/BookmarkStore";
import {List} from "immutable";

@Component({
  selector: 'my-bookmarks',
  templateUrl: './bookmarks.component.html',
  styleUrls: ['./bookmarks.component.scss']
})
export class BookmarksComponent implements  OnInit{

  publicBookmarks: Observable<List<Bookmark>>;

  constructor(private bookmarkStore: BookmarkStore) { }

  getBookmarks(): void {
    this.publicBookmarks = this.bookmarkStore.getBookmarks();
    console.log('BookmarksComponent.getBookmarks - publicBookmarks');
    console.log(this.publicBookmarks);
  }

  ngOnInit(): void {
    this.getBookmarks();
  }

}
