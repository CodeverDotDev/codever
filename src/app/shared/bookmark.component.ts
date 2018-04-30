import {Component, Input} from '@angular/core';
import {Bookmark} from '../core/model/bookmark';
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-bookmark',
  templateUrl: './bookmark.component.html'
})
export class BookmarkComponent {

  @Input()
  bookmark: Bookmark;

  @Input()
  isPrivate: boolean;

  @Input()
  queryText: string;

  @Input()
  userId: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}
  /**
   *
   * @param bookmark
   */
  gotoDetail(bookmark: Bookmark): void {
    const link = ['./bookmarks', bookmark._id];
    this.router.navigate(link, { relativeTo: this.route });
  }


}
