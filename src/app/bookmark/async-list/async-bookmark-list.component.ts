import {Component, OnInit, Output, Input} from '@angular/core';
import {Router, ActivatedRoute} from "@angular/router";
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

  constructor( private route: ActivatedRoute, private router: Router, private bookmarkStore: BookmarkStore) { }

  /**
   *
   * @param bookmark
   */
  gotoDetail(bookmark: Bookmark): void {
    this.router.navigate([bookmark._id], { relativeTo: this.route });
  }

}
