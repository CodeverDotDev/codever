import {Component, OnInit} from '@angular/core';
import {Bookmark} from "./bookmark";
import {BOOKMARKS} from "./mock-bookmarks";
import {BookmarkService} from "./bookmark.service";

@Component({
  selector: 'my-bookmarks',
  templateUrl: './bookmarks.component.html',
  styleUrls: ['./bookmarks.component.scss']
})
export class BookmarksComponent implements  OnInit{

  title = 'Bookmark management';
  bookmarks: Bookmark[];
  selectedBookmark: Bookmark;

  constructor(private bookmarkService: BookmarkService) { }

  getBookmarks(): void {
    this.bookmarkService.getBookmarks().then(bookmarks => this.bookmarks = bookmarks);
  }

  ngOnInit(): void {
    this.getBookmarks();
  }

  onSelect(bookmark: Bookmark): void {
    this.selectedBookmark = bookmark;
  }
}
