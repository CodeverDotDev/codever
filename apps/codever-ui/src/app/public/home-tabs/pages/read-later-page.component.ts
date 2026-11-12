import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '../../../core/auth/authentication.service';
import { Bookmark } from '../../../core/model/bookmark';
import { PaginationNotificationService } from '../../../core/pagination-notification.service';
import { UserDataReadLaterStore } from '../../../core/user/userdata.readlater.store';
import { UserDataStore } from '../../../core/user/userdata.store';
import { UserDataWatchedTagsStore } from '../../../core/user/userdata.watched-tags.store';
import { AsyncBookmarkListComponent } from '../../../shared/async-bookmark-list/async-bookmark-list.component';
import { HomeTabPageBase } from './home-tab-page.base';

@Component({
  selector: 'app-read-later-page',
  templateUrl: './read-later-page.component.html',
  styleUrls: ['./home-tab-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [AsyncPipe, AsyncBookmarkListComponent],
})
export class ReadLaterPageComponent
  extends HomeTabPageBase
  implements OnInit
{
  readonly callerPagination = 'read-later';
  readLater$: Observable<Bookmark[]>;

  constructor(
    route: ActivatedRoute,
    authenticationService: AuthenticationService,
    userDataStore: UserDataStore,
    paginationNotificationService: PaginationNotificationService,
    private readonly userDataReadLaterStore: UserDataReadLaterStore,
    public userDataWatchedTagsStore: UserDataWatchedTagsStore,
    public loginDialog: MatDialog
  ) {
    super(
      route,
      authenticationService,
      userDataStore,
      paginationNotificationService,
      'read-later'
    );
  }

  ngOnInit(): void {
    this.initializePage((page) => {
      this.readLater$ = this.userDataReadLaterStore.getReadLater$(
        this.userId,
        page
      );
    });
  }
}
