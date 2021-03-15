import { Component, EventEmitter, Injector, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Observable } from 'rxjs';
import { Bookmark } from '../../core/model/bookmark';
import { ActivatedRoute, Router } from '@angular/router';
import { UserData } from '../../core/model/user-data';
import { MatDialog } from '@angular/material/dialog';
import { PaginationNotificationService } from '../../core/pagination-notification.service';
import { environment } from '../../../environments/environment';
import { PaginationAction } from '../../core/model/pagination-action';
import { UserDataWatchedTagsStore } from '../../core/user/userdata.watched-tags.store';
import { TagFollowingBaseComponent } from '../tag-following-base-component/tag-following-base.component';

@Component({
  selector: 'app-async-bookmark-list',
  templateUrl: './async-bookmark-list.component.html',
  styleUrls: ['./async-bookmark-list.component.scss']
})
export class AsyncBookmarkListComponent extends TagFollowingBaseComponent implements OnInit, OnChanges {

  verifyForWatchedTag: Observable<string>; // used to avoid looking in watchedTags for other tags in the html template

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

  @Output()
  bookmarkDeleted = new EventEmitter<boolean>();

  private router: Router;
  readonly route: ActivatedRoute;
  private paginationNotificationService: PaginationNotificationService;

  environment = environment;

  currentPage: number;
  paginationSize = environment.PAGINATION_PAGE_SIZE;

  Arr = Array; // Array type captured in a variable

  @Input()
  showFilterBox = true;
  filterText = '';

  constructor(
    private injector: Injector,
    public userDataWatchedTagsStore: UserDataWatchedTagsStore,
    public loginDialog: MatDialog,
  ) {
    super(loginDialog, userDataWatchedTagsStore);
    this.router = <Router>this.injector.get(Router);
    this.route = <ActivatedRoute>this.injector.get(ActivatedRoute);
    this.paginationNotificationService = <PaginationNotificationService>this.injector.get(PaginationNotificationService);
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

  navigate(page: number) {
    const paginationAction: PaginationAction = {
      caller: this.callerPagination,
      page: page
    }
    this.currentPage = page;
    this.syncPageQueryParam();
    this.paginationNotificationService.clickPageNavigation(paginationAction);
  }

  syncPageQueryParam() {
    this.router.navigate(['.'],
      {
        relativeTo: this.route,
        queryParams: {page: this.currentPage},
        queryParamsHandling: 'merge'
      }
    );
  }
}
