import {Component, Input, NgZone} from "@angular/core";
import {Router, ActivatedRoute} from "@angular/router";
import {Observable} from "rxjs";
import {Bookmark} from "../../core/model/bookmark";
import {UserBookmarkStore} from "../store/UserBookmarkStore";

@Component({
  selector: 'my-async-personal-bookmark-list',
  templateUrl: './async-personal-bookmark-list.component.html',
  styleUrls: ['./async-personal-bookmark-list.component.scss']
})
export class AsyncUserBookmarksListComponent{

  @Input()
  bookmarks: Observable<Bookmark[]>;

  constructor(
    private zone:NgZone, //TODO without explicitly running the zone functionality the view does not get updated, though model and everything gets updated
    private route: ActivatedRoute,
    private router: Router,
    private userBookmarkStore: UserBookmarkStore) {}

  /**
   *
   * @param bookmark
   */
  gotoDetail(bookmark: Bookmark): void {
    let link = ['./bookmarks', bookmark._id];
    this.router.navigate(link, { relativeTo: this.route });
  }

  deleteBookmark(bookmark:Bookmark): void {

    let obs = this.userBookmarkStore.deleteBookmark(bookmark);
    obs.subscribe(
      res => {
        this.zone.run(() => {
          console.log("ZONE RUN bookmark deleted");
        });
      });
  }

}
