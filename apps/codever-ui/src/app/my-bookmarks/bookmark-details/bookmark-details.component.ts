import { Component, OnDestroy, OnInit } from '@angular/core';
import { Bookmark } from '../../core/model/bookmark';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { startWith, tap } from 'rxjs/operators';
import { UserData } from '../../core/model/user-data';
import { UserInfoStore } from '../../core/user/user-info.store';
import { UserDataStore } from '../../core/user/userdata.store';
import { PersonalBookmarksService } from '../../core/personal-bookmarks.service';
import { AuthenticationService } from '../../core/auth/authentication.service';
import {
  BookmarkShortcutContext,
  MAIN_LINK_SHORTCUT_PRIORITY,
  MainLinkShortcutService,
} from '../../core/shortcut/main-link-shortcut.service';
import { BookmarkListElementComponent } from '../../shared/bookmark-list-element/bookmark-list-element.component';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-bookmark-details',
  templateUrl: './bookmark-details.component.html',
  styleUrls: ['./bookmark-details.component.scss'],
  imports: [BookmarkListElementComponent, AsyncPipe],
})
export class BookmarkDetailsComponent implements OnInit, OnDestroy {
  bookmark$: Observable<Bookmark>;
  userData$: Observable<UserData>;
  popup: string;

  /** Latest loaded bookmark, exposed to the `k+k` shortcut context. */
  private currentBookmark: Bookmark | null = null;
  private readonly shortcutContext: BookmarkShortcutContext = {
    priority: MAIN_LINK_SHORTCUT_PRIORITY.DETAILS,
    getSingleVisibleBookmark: () => this.currentBookmark,
    isUserLoggedIn: () => this.authenticationService.isLoggedIn(),
  };

  constructor(
    private route: ActivatedRoute,
    private userInfoStore: UserInfoStore,
    private userDataStore: UserDataStore,
    private personalBookmarksService: PersonalBookmarksService,
    private authenticationService: AuthenticationService,
    private mainLinkShortcutService: MainLinkShortcutService
  ) {}

  ngOnInit() {
    this.popup = this.route.snapshot.queryParamMap.get('popup');
    this.mainLinkShortcutService.register(this.shortcutContext);

    this.userInfoStore.getUserInfoOidc$().subscribe((userInfo) => {
      this.userData$ = this.userDataStore.getUserData$();

      // Always fetch the latest version from the API so edits made elsewhere
      // (e.g. on another device) are reflected. A bookmark passed through
      // router state (e.g. from the pinned / quick-access panel, history or
      // search results) can be stale, so it is only used as an instant
      // placeholder while the fresh copy loads.
      const bookmarkId = this.route.snapshot.paramMap.get('id');
      const freshBookmark$ =
        this.personalBookmarksService.getPersonalBookmarkById(
          userInfo.sub,
          bookmarkId
        );

      const stateBookmark: Bookmark = window.history.state.bookmark;
      this.bookmark$ = (
        stateBookmark
          ? freshBookmark$.pipe(startWith(stateBookmark))
          : freshBookmark$
      ).pipe(tap((bookmark) => (this.currentBookmark = bookmark)));
    });
  }

  ngOnDestroy() {
    this.mainLinkShortcutService.unregister(this.shortcutContext);
  }

  closeDialog() {
    window.close();
  }
}
