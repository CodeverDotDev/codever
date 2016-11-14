import {Component, OnInit, Output, Input} from '@angular/core';
import {Router} from "@angular/router";
import {Observable} from "rxjs";
import {Bookmark} from "../../model/bookmark";
import {BookmarkService} from "../bookmark.service";
import {BookmarkStore} from "../store/BookmarkStore";

@Component({
  selector: 'my-async-bookmark-list',
  templateUrl: './async-bookmark-list.component.html',
  styleUrls: ['./async-bookmark-list.component.scss']
})
export class AsyncBookmarksListComponent{

  @Input()
  bookmarks: Observable<Bookmark[]>;

  selectedBookmark: Bookmark;

  constructor( private router: Router, private bookmarkService: BookmarkService, private bookmarkStore: BookmarkStore) { }

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

  deleteBookmark(bookmark:Bookmark): void {
    this.bookmarkStore.deleteBookmark(bookmark);
  }

  delete(bookmark: Bookmark): void {
    this.bookmarkService
      .delete(bookmark._id)
      .subscribe(
        data => {
          // refresh the list
          this.bookmarks.map(h => h.filter(x => x !== bookmark));
          //this.getBookmarks();
          return true;
        },
        error => {
          console.error("Error deleting bookmark!");
          return Observable.throw(error);
        });
  }

}
