import {Component, Input} from "@angular/core";
import {Router, ActivatedRoute} from "@angular/router";
import {Observable} from "rxjs";
import {Bookmark} from "../../model/bookmark";
import {UserBookmarkStore} from "../store/UserBookmarkStore";

@Component({
  selector: 'my-async-user-bookmark-list',
  templateUrl: './async-user-bookmark-list.component.html',
  styleUrls: ['./async-user-bookmark-list.component.scss']
})
export class AsyncUserBookmarksListComponent{

  @Input()
  bookmarks: Observable<Bookmark[]>;

  constructor( private route: ActivatedRoute, private router: Router, private userBookmarkStore: UserBookmarkStore) {
    console.log("Async Fuuuukiiiiiiing constructor");
  }

  /**
   *
   * @param bookmark
   */
  gotoDetail(bookmark: Bookmark): void {
    console.log("At least lands in the method........");
    let link = ['./bookmarks', bookmark._id];
    this.router.navigate(link, { relativeTo: this.route });
  }

  deleteBookmark(bookmark:Bookmark): void {
    this.userBookmarkStore.deleteBookmark(bookmark);
  }

}
