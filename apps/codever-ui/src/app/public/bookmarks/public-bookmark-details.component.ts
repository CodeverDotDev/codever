import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Bookmark } from '../../core/model/bookmark';
import { PublicBookmarksService } from './public-bookmarks.service';
import { AuthenticationService } from '../../core/auth/authentication.service';
import {
  BookmarkShortcutContext,
  MAIN_LINK_SHORTCUT_PRIORITY,
  MainLinkShortcutService,
} from '../../core/shortcut/main-link-shortcut.service';
import { BookmarkListElementComponent } from '../../shared/bookmark-list-element/bookmark-list-element.component';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-public-bookmark-details',
  templateUrl: './public-bookmark-details.component.html',
  imports: [BookmarkListElementComponent, AsyncPipe],
})
export class PublicBookmarkDetailsComponent implements OnInit, OnDestroy {
  showMoreText = false;
  bookmark$: Observable<Bookmark>;

  /** Latest loaded bookmark, exposed to the `k+k` shortcut context. */
  private currentBookmark: Bookmark | null = null;
  private readonly shortcutContext: BookmarkShortcutContext = {
    priority: MAIN_LINK_SHORTCUT_PRIORITY.DETAILS,
    getSingleVisibleBookmark: () => this.currentBookmark,
    isUserLoggedIn: () => this.authenticationService.isLoggedIn(),
  };

  constructor(
    private publicBookmarksService: PublicBookmarksService,
    private route: ActivatedRoute,
    private authenticationService: AuthenticationService,
    private mainLinkShortcutService: MainLinkShortcutService
  ) {}

  ngOnInit() {
    this.mainLinkShortcutService.register(this.shortcutContext);

    const source$ = !window.history.state.bookmark
      ? this.publicBookmarksService.getPublicBookmarkById(
          this.route.snapshot.paramMap.get('id')
        )
      : of(window.history.state.bookmark as Bookmark);

    this.bookmark$ = source$.pipe(
      tap((bookmark) => (this.currentBookmark = bookmark))
    );
  }

  ngOnDestroy() {
    this.mainLinkShortcutService.unregister(this.shortcutContext);
  }
}
