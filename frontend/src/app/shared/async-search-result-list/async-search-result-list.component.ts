import { Component, EventEmitter, Injector, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Bookmark } from '../../core/model/bookmark';
import { ActivatedRoute } from '@angular/router';
import { UserData } from '../../core/model/user-data';
import { MatDialog } from '@angular/material/dialog';
import { UserDataWatchedTagsStore } from '../../core/user/userdata.watched-tags.store';
import { TagFollowingBaseComponent } from '../tag-following-base-component/tag-following-base.component';
import { Snippet } from '../../core/model/snippet';

@Component({
  selector: 'app-async-search-result-list',
  templateUrl: './async-search-result-list.component.html',
  styleUrls: ['./async-search-result-list.component.scss']
})
export class AsyncSearchResultListComponent extends TagFollowingBaseComponent implements OnInit, OnChanges {

  verifyForWatchedTag: Observable<string>; // used to avoid looking in watchedTags for other tags in the html template

  @Input()
  searchResults$: Observable<(Bookmark | Snippet)[]>;

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

  currentPage: number;

  @Input()
  showFilterBox = true;
  filterText = '';

  constructor(
    private injector: Injector,
    public userDataWatchedTagsStore: UserDataWatchedTagsStore,
    public loginDialog: MatDialog,
  ) {
    super(loginDialog, userDataWatchedTagsStore);
    this.route = <ActivatedRoute>this.injector.get(ActivatedRoute);
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    const page = this.route.snapshot.queryParamMap.get('page');
    if (page) {
      this.currentPage = parseInt(page, 0);
    } else {
      this.currentPage = 1;
    }
  }


  isBookmark(searchResult: Bookmark | Snippet) {
    return 'location' in searchResult;
  }

  isSnippet(searchResult: Bookmark | Snippet) {
    return 'codeSnippets' in searchResult;
  }

  of(searchResult: Snippet | Bookmark) {
    return of(searchResult);
  }
}
