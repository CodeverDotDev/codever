import {Component, OnInit, Output} from '@angular/core';
import {Bookmark} from "./bookmark";
import {BookmarkService} from "./bookmark.service";
import {Router} from "@angular/router";
import {Observable} from "rxjs";
import {BookmarkStore} from "./state/BookmarkStore";
import {List} from 'immutable';
import {Logger} from "../logger.service";

@Component({
  selector: 'my-bookmarks',
  templateUrl: './bookmarks.component.html',
  styleUrls: ['./bookmarks.component.scss']
})
export class BookmarksComponent implements  OnInit{

  allBookmarks: Observable<List<Bookmark>>;
  selectedBookmark: Bookmark;

  constructor( private router: Router,
               private bookmarkService: BookmarkService,
               private bookmarkStore: BookmarkStore,
               private logger:Logger
  ) { }

  getBookmarks(): void {
    //this.allBookmarks = this.bookmarkService.getBookmarks();
    this.allBookmarks = this.bookmarkStore.getBookmarks();
    console.log('BookmarksComponent.getBookmarks - allBookmarks');
    console.log(this.allBookmarks);
  }

  ngOnInit(): void {
    this.getBookmarks();
  }

  onSelect(bookmark: Bookmark): void {
    this.selectedBookmark = bookmark;
  }

}
