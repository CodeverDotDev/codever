import {
  Component,
  EventEmitter,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Observable, of, Subscription } from 'rxjs';
import { Bookmark } from '../../core/model/bookmark';
import { ActivatedRoute } from '@angular/router';
import { UserData } from '../../core/model/user-data';
import { MatDialog } from '@angular/material/dialog';
import { UserDataWatchedTagsStore } from '../../core/user/userdata.watched-tags.store';
import { TagFollowingBaseComponent } from '../tag-following-base-component/tag-following-base.component';
import { Note } from '../../core/model/note';
import { AuthenticationService } from '../../core/auth/authentication.service';
import {
  BookmarkShortcutContext,
  MAIN_LINK_SHORTCUT_PRIORITY,
  MainLinkShortcutService,
} from '../../core/shortcut/main-link-shortcut.service';
import { FormsModule } from '@angular/forms';
import { BookmarkListElementComponent } from '../bookmark-list-element/bookmark-list-element.component';
import { NoteDetailsComponent } from '../note-details/note-details.component';
import { PageNavigationBarComponent } from '../page-navigation-bar/page-navigation-bar.component';
import { AsyncPipe } from '@angular/common';
import { ResourceFilterPipe } from '../pipe/resource-filter.pipe';

@Component({
  selector: 'app-async-search-result-list',
  templateUrl: './async-search-result-list.component.html',
  styleUrls: ['./async-search-result-list.component.scss'],
  imports: [
    FormsModule,
    BookmarkListElementComponent,
    NoteDetailsComponent,
    PageNavigationBarComponent,
    AsyncPipe,
    ResourceFilterPipe,
  ],
})
export class AsyncSearchResultListComponent
  extends TagFollowingBaseComponent
  implements OnInit, OnDestroy
{
  declare verifyForWatchedTag: Observable<string>; // used to avoid looking in watchedTags for other tags in the html template

  @Input()
  searchResults$: Observable<(Bookmark | Note)[]>;

  @Input()
  queryText: string; // used for highlighting search terms in the bookmarks list

  @Input()
  userData$: Observable<UserData>;

  @Input()
  callerPagination: string;

  @Input()
  showPagination = true;

  @Input()
  isSearchResultsPage = false;

  @Output()
  bookmarkDeleted = new EventEmitter<boolean>();

  readonly route: ActivatedRoute;

  @Input()
  currentPage = 1;

  @Input()
  showFilterBox = true;
  filterText = '';

  private readonly authenticationService: AuthenticationService;
  private readonly mainLinkShortcutService: MainLinkShortcutService;
  private readonly resourceFilter = new ResourceFilterPipe();

  /** Snapshot of the current results, used to resolve shortcuts. */
  private searchResultsSnapshot: (Bookmark | Note)[] = [];
  private searchResultsSubscription: Subscription;

  private readonly shortcutContext: BookmarkShortcutContext = {
    priority: MAIN_LINK_SHORTCUT_PRIORITY.SEARCH,
    getSingleVisibleBookmark: () => this.singleVisibleBookmark(),
    isUserLoggedIn: () => this.authenticationService.isLoggedIn(),
  };

  constructor(
    private injector: Injector,
    public userDataWatchedTagsStore: UserDataWatchedTagsStore,
    public loginDialog: MatDialog
  ) {
    super(loginDialog, userDataWatchedTagsStore);
    this.route = <ActivatedRoute>this.injector.get(ActivatedRoute);
    this.authenticationService = this.injector.get(AuthenticationService);
    this.mainLinkShortcutService = this.injector.get(MainLinkShortcutService);
  }

  ngOnInit(): void {
    this.searchResultsSubscription = this.searchResults$?.subscribe(
      (results) => (this.searchResultsSnapshot = results || [])
    );
    // Only the dedicated search results page participates in the global k+k
    // sequence; other reuses (e.g. the home tabs) still support Enter.
    if (this.isSearchResultsPage) {
      this.mainLinkShortcutService.register(this.shortcutContext);
    }
  }

  ngOnDestroy(): void {
    this.searchResultsSubscription?.unsubscribe();
    this.mainLinkShortcutService.unregister(this.shortcutContext);
  }

  isBookmark(searchResult: Bookmark | Note) {
    return searchResult.type === 'bookmark';
  }

  isNote(searchResult: Bookmark | Note) {
    return searchResult.type === 'note';
  }

  of(searchResult: Bookmark | Note) {
    return of(searchResult);
  }

  /** Enter in the focused filter opens the only visible bookmark's main link. */
  onFilterEnter(): void {
    const bookmark = this.singleVisibleBookmark();
    if (bookmark) {
      this.mainLinkShortcutService.openBookmarkInNewTab(
        bookmark,
        this.authenticationService.isLoggedIn()
      );
    }
  }

  /** The single visible bookmark after filtering, or null when ambiguous. */
  private singleVisibleBookmark(): Bookmark | null {
    const filtered = this.resourceFilter.transform(
      this.searchResultsSnapshot,
      this.filterText
    );
    if (filtered.length === 1 && filtered[0].type === 'bookmark') {
      return filtered[0] as Bookmark;
    }
    return null;
  }

  /** True when the current filter narrows the results to exactly one bookmark. */
  get hasSingleFilteredBookmark(): boolean {
    return this.singleVisibleBookmark() !== null;
  }
}
