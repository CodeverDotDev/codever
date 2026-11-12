import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '../../../core/auth/authentication.service';
import { UserDataResource } from '../../../core/model/user-data-resource.type';
import { PaginationNotificationService } from '../../../core/pagination-notification.service';
import { UserDataPinnedStore } from '../../../core/user/userdata.pinned.store';
import { UserDataStore } from '../../../core/user/userdata.store';
import { UserDataWatchedTagsStore } from '../../../core/user/userdata.watched-tags.store';
import { AsyncSearchResultListComponent } from '../../../shared/async-search-result-list/async-search-result-list.component';
import { HomeTabPageBase } from './home-tab-page.base';

@Component({
  selector: 'app-pinned-page',
  templateUrl: './pinned-page.component.html',
  styleUrls: ['./home-tab-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [AsyncPipe, AsyncSearchResultListComponent],
})
export class PinnedPageComponent extends HomeTabPageBase implements OnInit {
  readonly callerPagination = 'pinned';
  pinned$: Observable<UserDataResource[]>;

  constructor(
    route: ActivatedRoute,
    authenticationService: AuthenticationService,
    userDataStore: UserDataStore,
    paginationNotificationService: PaginationNotificationService,
    private readonly userDataPinnedStore: UserDataPinnedStore,
    public userDataWatchedTagsStore: UserDataWatchedTagsStore,
    public loginDialog: MatDialog
  ) {
    super(
      route,
      authenticationService,
      userDataStore,
      paginationNotificationService,
      'pinned'
    );
  }

  ngOnInit(): void {
    this.initializePage((page) => {
      this.pinned$ = this.userDataPinnedStore.getPinnedResources$(
        this.userId,
        page
      );
    });
  }
}
