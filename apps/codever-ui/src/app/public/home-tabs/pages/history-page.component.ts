import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '../../../core/auth/authentication.service';
import { UserDataResource } from '../../../core/model/user-data-resource.type';
import { PaginationNotificationService } from '../../../core/pagination-notification.service';
import { UserDataHistoryStore } from '../../../core/user/userdata.history.store';
import { UserDataStore } from '../../../core/user/userdata.store';
import { UserDataWatchedTagsStore } from '../../../core/user/userdata.watched-tags.store';
import { AsyncSearchResultListComponent } from '../../../shared/async-search-result-list/async-search-result-list.component';
import { HomeTabPageBase } from './home-tab-page.base';

@Component({
  selector: 'app-history-page',
  templateUrl: './history-page.component.html',
  styleUrls: ['./home-tab-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [AsyncPipe, AsyncSearchResultListComponent],
})
export class HistoryPageComponent
  extends HomeTabPageBase
  implements OnInit
{
  readonly callerPagination = 'history';
  history$: Observable<UserDataResource[]>;

  constructor(
    route: ActivatedRoute,
    authenticationService: AuthenticationService,
    userDataStore: UserDataStore,
    paginationNotificationService: PaginationNotificationService,
    private readonly userDataHistoryStore: UserDataHistoryStore,
    public userDataWatchedTagsStore: UserDataWatchedTagsStore,
    public loginDialog: MatDialog
  ) {
    super(
      route,
      authenticationService,
      userDataStore,
      paginationNotificationService,
      'history'
    );
  }

  ngOnInit(): void {
    this.initializePage((page) => {
      this.history$ = this.userDataHistoryStore.getHistory$(this.userId, page);
    });
  }
}
