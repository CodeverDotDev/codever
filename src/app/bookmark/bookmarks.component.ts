import {Component, OnInit, Output} from '@angular/core';
import {Bookmark} from "./bookmark";
import {BookmarkService} from "./bookmark.service";
import {Router} from "@angular/router";
import {Observable} from "rxjs";

@Component({
  selector: 'my-bookmarks',
  templateUrl: './bookmarks.component.html',
  styleUrls: ['./bookmarks.component.scss']
})
export class BookmarksComponent implements  OnInit{

  allBookmarks: Observable<Bookmark[]>;
  selectedBookmark: Bookmark;

  constructor( private router: Router, private bookmarkService: BookmarkService) { }

  getBookmarks(): void {
    this.allBookmarks = this.bookmarkService.getBookmarks();
  }

  ngOnInit(): void {
    this.getBookmarks();
  }

  onSelect(bookmark: Bookmark): void {
    this.selectedBookmark = bookmark;
  }

}
