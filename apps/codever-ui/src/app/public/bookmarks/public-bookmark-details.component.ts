import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Bookmark } from '../../core/model/bookmark';
import { PublicBookmarksService } from './public-bookmarks.service';
import { BookmarkListElementComponent } from '../../shared/bookmark-list-element/bookmark-list-element.component';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-public-bookmark-details',
  templateUrl: './public-bookmark-details.component.html',
  imports: [BookmarkListElementComponent, AsyncPipe],
})
export class PublicBookmarkDetailsComponent implements OnInit {
  showMoreText = false;
  bookmark$: Observable<Bookmark>;

  constructor(
    private publicBookmarksService: PublicBookmarksService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    if (!window.history.state.bookmark) {
      const bookmarkId = this.route.snapshot.paramMap.get('id');
      this.bookmark$ =
        this.publicBookmarksService.getPublicBookmarkById(bookmarkId);
    } else {
      this.bookmark$ = of(window.history.state.bookmark);
    }
  }
}
