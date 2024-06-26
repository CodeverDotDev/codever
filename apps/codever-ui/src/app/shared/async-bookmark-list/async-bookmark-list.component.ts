import {
  Component,
  EventEmitter,
  Injector,
  Input,
  Output,
} from '@angular/core';
import { Observable } from 'rxjs';
import { Bookmark } from '../../core/model/bookmark';
import { ActivatedRoute } from '@angular/router';
import { UserData } from '../../core/model/user-data';
import { MatDialog } from '@angular/material/dialog';
import { UserDataWatchedTagsStore } from '../../core/user/userdata.watched-tags.store';
import { TagFollowingBaseComponent } from '../tag-following-base-component/tag-following-base.component';

@Component({
  selector: 'app-async-bookmark-list',
  templateUrl: './async-bookmark-list.component.html',
  styleUrls: ['./async-bookmark-list.component.scss'],
})
export class AsyncBookmarkListComponent extends TagFollowingBaseComponent {
  declare verifyForWatchedTag: Observable<string>; // used to avoid looking in watchedTags for other tags in the html template

  @Input()
  bookmarks$: Observable<Bookmark[]>;

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

  Arr = Array; // Array type captured in a variable

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
}
