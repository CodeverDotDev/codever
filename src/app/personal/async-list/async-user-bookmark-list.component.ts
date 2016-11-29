import {Component, OnInit, Output, Input} from '@angular/core';
import {Router} from "@angular/router";
import {Observable} from "rxjs";
import {Bookmark} from "../../model/bookmark";
import {UserBookmarkService} from "../user-bookmark.service";
import {UserBookmarkStore} from "../store/UserBookmarkStore";

@Component({
  selector: 'my-async-user-bookmark-list',
  templateUrl: './async-user-bookmark-list.component.html',
  styleUrls: ['./async-user-bookmark-list.component.scss']
})
export class AsyncUserBookmarksListComponent{

  @Input()
  bookmarks: Observable<Bookmark[]>;

  selectedBookmark: Bookmark;

  constructor( private router: Router, private userBookmarkStore: UserBookmarkStore) { }

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
    this.userBookmarkStore.deleteBookmark(bookmark);
  }

}
