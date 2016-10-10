import {Component, OnInit} from '@angular/core';
import {Bookmark} from "./bookmark";
import {BOOKMARKS} from "./mock-bookmarks";
import {BookmarkService} from "./bookmark.service";
import {Router} from "@angular/router";

@Component({
  selector: 'my-bookmarks',
  templateUrl: './bookmarks.component.html',
  styleUrls: ['./bookmarks.component.scss']
})
export class BookmarksComponent implements  OnInit{

  title = 'Bookmark management';
  bookmarks: Bookmark[];
  selectedBookmark: Bookmark;

  constructor( private router: Router, private bookmarkService: BookmarkService) { }

  getBookmarks(): void {
    this.bookmarkService.getBookmarks().then(bookmarks => this.bookmarks = bookmarks);
  }

  ngOnInit(): void {
    this.getBookmarks();
  }

  onSelect(bookmark: Bookmark): void {
    this.selectedBookmark = bookmark;
  }

  /*
  gotoDetail(): void {
    this.router.navigate(['/bookmarks', this.selectedBookmark.id]);
  }
  */
  gotoDetail(bookmark: Bookmark): void {
    let link = ['/bookmarks', bookmark.id];
    this.router.navigate(link);
  }
}
