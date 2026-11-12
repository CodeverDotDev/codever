import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../../environments/environment';
import { Bookmark } from '../../../core/model/bookmark';
import { UserData } from '../../../core/model/user-data';
import { UserDataStore } from '../../../core/user/userdata.store';
import { AuthenticationService } from '../../../core/auth/authentication.service';
import { PublicBookmarksStore } from '../../bookmarks/store/public-bookmarks-store.service';
import { FeedStore } from '../../../core/user/feed-store.service';
import { UserDataWatchedTagsStore } from '../../../core/user/userdata.watched-tags.store';
import { AppService } from '../../../app.service';
import { PaginationNotificationService } from '../../../core/pagination-notification.service';
import { TagFollowingBaseComponent } from '../../../shared/tag-following-base-component/tag-following-base.component';
import { AsyncBookmarkListComponent } from '../../../shared/async-bookmark-list/async-bookmark-list.component';
import { SearchDomain } from '../../../core/model/search-domain.enum';

@Component({
  selector: 'app-feed-page',
  templateUrl: './feed-page.component.html',
  styleUrls: ['./home-tab-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [AsyncPipe, RouterLink, AsyncBookmarkListComponent],
})
export class FeedPageComponent
  extends TagFollowingBaseComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  readonly callerPagination = 'feed';
  readonly currentPageFirst = 1;
  readonly userIsLoggedIn: boolean;
  readonly userData$: Observable<UserData> | undefined;
  feedBookmarks$: Observable<Bookmark[]>;
  showLoginButton = false;
  currentPage = this.currentPageFirst;
  private userId: string;
  private userData: UserData;
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly publicBookmarksStore: PublicBookmarksStore,
    private readonly feedStore: FeedStore,
    private readonly userDataStore: UserDataStore,
    private readonly authenticationService: AuthenticationService,
    private readonly appService: AppService,
    private readonly paginationNotificationService: PaginationNotificationService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    public userDataWatchedTagsStore: UserDataWatchedTagsStore,
    public loginDialog: MatDialog
  ) {
    super(loginDialog, userDataWatchedTagsStore);
    this.userIsLoggedIn = authenticationService.isLoggedIn();
    this.userData$ = this.userIsLoggedIn
      ? userDataStore.getUserData$()
      : undefined;
  }

  ngOnInit(): void {
    const page = Number.parseInt(
      this.route.snapshot.queryParamMap.get('page') || '',
      10
    );
    this.currentPage = Number.isInteger(page) && page > 0 ? page : 1;

    if (this.userIsLoggedIn) {
      this.subscriptions.add(
        this.userData$?.subscribe((userData) => {
          this.userId = userData.userId;
          this.userData = userData;
          this.loadFeedPage(this.currentPage);
        })
      );
    } else {
      this.loadFeedPage(this.currentPage);
    }

    this.subscriptions.add(
      this.appService.logoClicked.subscribe((logoClicked) => {
        if (logoClicked) {
          this.currentPage = this.currentPageFirst;
          this.loadFeedPage(this.currentPage);
        }
      })
    );
    this.subscriptions.add(
      this.paginationNotificationService.pageNavigationClicked$.subscribe(
        (paginationAction) => {
          if (paginationAction.caller === this.callerPagination) {
            this.currentPage = paginationAction.page;
            this.loadFeedPage(paginationAction.page);
          }
        }
      )
    );
  }

  private loadFeedPage(page: number): void {
    if (this.userIsLoggedIn && !this.userData?.showAllPublicInFeed) {
      if (this.userId) {
        this.feedBookmarks$ = this.feedStore.getFeedBookmarks$(this.userId, page);
      }
    } else {
      this.feedBookmarks$ =
        this.publicBookmarksStore.getRecentPublicBookmarks$(page);
    }
  }

  login(): void {
    const pageQuery = this.currentPage > 1 ? `?page=${this.currentPage}` : '';
    this.authenticationService.login({
      redirectUri: `${environment.APP_HOME_URL}/feed${pageQuery}`,
    });
  }

  searchPublicBookmarksByTag(tag: string): void {
    this.router.navigate(['/search'], {
      queryParams: {
        q: `[${tag}]`,
        sd: SearchDomain.ALL_PUBLIC,
        type: 'bookmark',
        page: this.currentPageFirst,
      },
    });
  }

  ngAfterViewInit(): void {
    this.showLoginButton = !this.userIsLoggedIn;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
