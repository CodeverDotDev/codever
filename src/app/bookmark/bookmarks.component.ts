import {Component, OnInit} from '@angular/core';
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

  title = 'My bookmarks';
  bookmarks: Observable<Bookmark[]>;
  bookmarksObservable: Observable<Bookmark[]>;
  selectedBookmark: Bookmark;

  constructor( private router: Router, private bookmarkService: BookmarkService) { }

  getBookmarks(): void {
    this.bookmarks = this.bookmarkService.getBookmarks();
  }

  getBookmarksObservable(): void {
    this.bookmarksObservable = this.bookmarkService.getBookmarksObservable();
  }

  ngOnInit(): void {
    this.getBookmarks();
    this.getBookmarksObservable();
  }

  onSelect(bookmark: Bookmark): void {
    this.selectedBookmark = bookmark;
  }

  /**
   *
   * @param bookmark
   */
  gotoDetail(bookmark: Bookmark): void {
    let link = ['/bookmarks', bookmark._id];
    this.router.navigate(link);
  }


  delete(bookmark: Bookmark): void {
    this.bookmarkService
        .delete(bookmark._id)

        .subscribe(
          data => {
            // refresh the list
            //this.bookmarks.map(h => h.filter(x => x !== bookmark));
            this.getBookmarks();
            return true;
          },
          error => {
            console.error("Error deleting bookmark!");
            return Observable.throw(error);
          });
    /*

        .map(this.bookmarks.map(h => h !== bookmark);
        .then(() => {
          this.bookmarks = this.bookmarks.map(h => h !== bookmark);
          if (this.selectedBookmark === bookmark) { this.selectedBookmark = null; }
        });
        */
  }

}
