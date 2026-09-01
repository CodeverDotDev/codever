import {
  Component,
  EventEmitter,
  Injector,
  Input,
  Output,
} from '@angular/core';
import { Observable, of } from 'rxjs';
import { Bookmark } from '../../core/model/bookmark';
import { ActivatedRoute } from '@angular/router';
import { UserData } from '../../core/model/user-data';
import { MatDialog } from '@angular/material/dialog';
import { UserDataWatchedTagsStore } from '../../core/user/userdata.watched-tags.store';
import { TagFollowingBaseComponent } from '../tag-following-base-component/tag-following-base.component';
import { Note } from '../../core/model/note';

@Component({
    selector: 'app-async-search-result-list',
    templateUrl: './async-search-result-list.component.html',
    styleUrls: ['./async-search-result-list.component.scss'],
    standalone: false
})
export class AsyncSearchResultListComponent extends TagFollowingBaseComponent {
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

  constructor(
    private injector: Injector,
    public userDataWatchedTagsStore: UserDataWatchedTagsStore,
    public loginDialog: MatDialog
  ) {
    super(loginDialog, userDataWatchedTagsStore);
    this.route = <ActivatedRoute>this.injector.get(ActivatedRoute);
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
}
