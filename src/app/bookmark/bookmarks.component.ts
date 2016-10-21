import {Component, OnInit} from '@angular/core';
import {Bookmark} from "./bookmark";
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
    let link = ['/bookmarks', bookmark._id];
    this.router.navigate(link);
  }

  delete(bookmark: Bookmark): void {
    this.bookmarkService
        .delete(bookmark._id)
        .then(() => {
          this.bookmarks = this.bookmarks.filter(h => h !== bookmark);
          if (this.selectedBookmark === bookmark) { this.selectedBookmark = null; }
        });
  }

}
