import {Component, Input, NgZone} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {Bookmark} from '../../core/model/bookmark';
import {PersonalBookmarksStore} from '../store/PersonalBookmarksStore';

@Component({
  selector: 'my-async-personal-bookmark-list',
  templateUrl: './async-personal-bookmark-list.component.html',
  styleUrls: ['./async-personal-bookmark-list.component.scss']
})
export class AsyncUserBookmarksListComponent{

  @Input()
  bookmarks: Observable<Bookmark[]>;

  constructor(
    private zone: NgZone, // TODO without explicitly running the zone functionality the view does not get updated, though model and everything gets updated
    private route: ActivatedRoute,
    private router: Router,
    private userBookmarkStore: PersonalBookmarksStore) {}

  /**
   *
   * @param bookmark
   */
  gotoDetail(bookmark: Bookmark): void {
    const link = ['./bookmarks', bookmark._id];
    this.router.navigate(link, { relativeTo: this.route });
  }

  deleteBookmark(bookmark: Bookmark): void {

    const obs = this.userBookmarkStore.deleteBookmark(bookmark);
    obs.subscribe(
      res => {
        this.zone.run(() => {
          console.log('ZONE RUN bookmark deleted');
        });
      });
  }

}
