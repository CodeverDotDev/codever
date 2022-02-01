import { Component, OnInit } from '@angular/core';
import { UserInfoStore } from '../../core/user/user-info.store';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Bookmark } from '../../core/model/bookmark';
import { PublicBookmarksService } from './public-bookmarks.service';

@Component({
  selector: 'app-public-bookmark-details',
  templateUrl: './public-bookmark-details.component.html'
})
export class PublicBookmarkDetailsComponent implements OnInit {
  showMoreText = false;
  bookmark$: Observable<Bookmark>;

  constructor(
    private publicBookmarksService: PublicBookmarksService,
    private userInfoStore: UserInfoStore,
    private route: ActivatedRoute) {
  }

  ngOnInit() {
    if (!window.history.state.bookmark) {
      const bookmarkId = this.route.snapshot.paramMap.get('id');
      this.bookmark$ = this.publicBookmarksService.getPublicBookmarkById(bookmarkId);
    } else {
      this.bookmark$ = of(window.history.state.bookmark);
    }
  }

}
