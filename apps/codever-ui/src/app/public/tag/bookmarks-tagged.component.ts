import { Component, OnInit } from '@angular/core';
import { BookmarksTaggedService } from './bookmarks-tagged.service';
import { ActivatedRoute } from '@angular/router';
import { Bookmark } from '../../core/model/bookmark';
import { Observable } from 'rxjs';
import { UserDataStore } from '../../core/user/userdata.store';
import { KeycloakService } from 'keycloak-angular';
import { UserData } from '../../core/model/user-data';
import {
  MatDialog,
  MatDialogConfig,
} from '@angular/material/dialog';
import { LoginRequiredDialogComponent } from '../../shared/dialog/login-required-dialog/login-required-dialog.component';
import { UserInfoStore } from '../../core/user/user-info.store';
import { environment } from '../../../environments/environment';
import { PaginationNotificationService } from '../../core/pagination-notification.service';
import { UserDataWatchedTagsStore } from '../../core/user/userdata.watched-tags.store';

@Component({
  selector: 'app-tag',
  templateUrl: './bookmarks-tagged.component.html',
  styleUrls: ['./bookmarks-tagged.component.css'],
})
export class BookmarksTaggedComponent implements OnInit {
  bookmarksForTag$: Observable<Bookmark[]>;
  tag: string;
  userData$: Observable<UserData>;
  counter = 30;
  orderBy = 'LATEST'; // TODO move to enum orderBy values
  userIsLoggedIn = false;
  currentPage: number;
  taggedCallerPagination = 'tagged-page';

  constructor(
    private tagService: BookmarksTaggedService,
    private userDataStore: UserDataStore,
    private userDataWatchedTagsStore: UserDataWatchedTagsStore,
    private userInfoStore: UserInfoStore,
    private keycloakService: KeycloakService,
    private paginationNotificationService: PaginationNotificationService,
    private route: ActivatedRoute,
    private loginDialog: MatDialog
  ) {}

  ngOnInit() {
    this.tag = this.route.snapshot.params['tag'];
    const page = this.route.snapshot.queryParamMap.get('page');
    if (page) {
      this.currentPage = parseInt(page, 0);
    } else {
      this.currentPage = 1;
    }
    this.route.paramMap.subscribe((params) => {
      this.tag = params.get('tag');
      if (this.tag) {
        this.bookmarksForTag$ = this.tagService.getBookmarksForTag(
          this.tag,
          this.orderBy,
          this.currentPage,
          environment.PAGINATION_PAGE_SIZE
        );
      } else {
        this.tag = this.route.snapshot.url[0].path;
        this.bookmarksForTag$ = this.tagService.getBookmarksForTag(
          this.tag,
          this.orderBy,
          this.currentPage,
          environment.PAGINATION_PAGE_SIZE
        );
      }
    });

    this.keycloakService.isLoggedIn().then((isLoggedIn) => {
      if (isLoggedIn) {
        this.userIsLoggedIn = true;
        this.userInfoStore.getUserInfoOidc$().subscribe((userInfo) => {
          this.userData$ = this.userDataStore.getUserData$();
        });
      }
    });

    this.paginationNotificationService.pageNavigationClicked$.subscribe(
      (paginationAction) => {
        if (paginationAction.caller === this.taggedCallerPagination) {
          this.bookmarksForTag$ = this.tagService.getBookmarksForTag(
            this.tag,
            this.orderBy,
            paginationAction.page,
            environment.PAGINATION_PAGE_SIZE
          );
        }
      }
    );
  }

  showMoreResults() {
    this.counter += 10;
  }

  getLatestForTag() {
    this.orderBy = 'LATEST';
    this.bookmarksForTag$ = this.tagService.getBookmarksForTag(
      this.tag,
      this.orderBy,
      this.currentPage,
      environment.PAGINATION_PAGE_SIZE
    );
  }

  getByLikeCount() {
    this.orderBy = 'LIKE_COUNT';
    this.bookmarksForTag$ = this.tagService.getBookmarksForTag(
      this.tag,
      this.orderBy,
      this.currentPage,
      environment.PAGINATION_PAGE_SIZE
    );
  }

  watchTag() {
    if (!this.userIsLoggedIn) {
      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
      dialogConfig.data = {
        message: 'You need to be logged in to follow tags',
      };

      this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    } else {
      this.userDataWatchedTagsStore.watchTag(this.tag);
    }
  }

  unwatchTag() {
    this.userDataWatchedTagsStore.unwatchTag(this.tag);
  }
}
