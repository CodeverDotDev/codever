import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Bookmark } from '../../core/model/bookmark';
import { ActivatedRoute, Router } from '@angular/router';
import { PublicBookmarksStore } from './store/public-bookmarks-store.service';
import { allTags } from '../../core/model/all-tags.const.en';
import { KeycloakService } from 'keycloak-angular';
import { UserData } from '../../core/model/user-data';
import { UserDataStore } from '../../core/user/userdata.store';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { UserInfoStore } from '../../core/user/user-info.store';
import { AppService } from '../../app.service';
import { PaginationNotificationService } from '../../core/pagination-notification.service';
import { UserDataHistoryStore } from '../../core/user/userdata.history.store';
import { UserDataPinnedStore } from '../../core/user/userdata.pinned.store';
import { UserDataReadLaterStore } from '../../core/user/userdata.readlater.store';
import { UserDataWatchedTagsStore } from '../../core/user/userdata.watched-tags.store';
import { TagFollowingBaseComponent } from '../../shared/tag-following-base-component/tag-following-base.component';
import { FeedStore } from '../../core/user/feed-store.service';
import { SearchDomain } from '../../core/model/search-domain.enum';
import { MatTabChangeEvent } from '@angular/material/tabs';

@Component({
  selector: 'app-public-bookmarks',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss'],
})
export class HomepageComponent
  extends TagFollowingBaseComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  readonly FIRST_PAGE = 1;

  feedBookmarks$: Observable<Bookmark[]>;
  pageNavigationSubscription: Subscription;
  tags: string[] = allTags;
  userData$: Observable<UserData>;
  private userData: UserData;

  history$: Observable<Bookmark[]>;
  pinned$: Observable<Bookmark[]>;
  readLater$: Observable<Bookmark[]>;

  userIsLoggedIn = false;
  showLoginButton = false;
  userId: string;
  userIsLoggedIn$: Promise<boolean>;

  selectedTabIndex: number;

  currentPageFeed = this.FIRST_PAGE;
  currentPageHistory = this.FIRST_PAGE;
  currentPagePinned = this.FIRST_PAGE;
  currentPageReadLater = this.FIRST_PAGE;
  callerPaginationFeed = 'feed';
  callerPaginationHistory = 'history';
  callerPaginationPinned = 'pinned';
  callerPaginationReadLater = 'read-later';

  constructor(
    private appService: AppService,
    private publicBookmarksStore: PublicBookmarksStore,
    private router: Router,
    private route: ActivatedRoute,
    private keycloakService: KeycloakService,
    private userDataStore: UserDataStore,
    private userDataHistoryStore: UserDataHistoryStore,
    private userDataPinnedStore: UserDataPinnedStore,
    private userDataReadLaterStore: UserDataReadLaterStore,
    private feedStore: FeedStore,
    public userDataWatchedTagsStore: UserDataWatchedTagsStore,
    public loginDialog: MatDialog,
    private userInfoStore: UserInfoStore,
    private paginationNotificationService: PaginationNotificationService
  ) {
    super(loginDialog, userDataWatchedTagsStore);
  }

  ngOnInit(): void {
    const tabQueryParam = this.route.snapshot.queryParamMap.get('tab');
    const page = this.route.snapshot.queryParamMap.get('page');
    this.userIsLoggedIn$ = this.keycloakService.isLoggedIn();

    this.userIsLoggedIn$.then((isLoggedIn) => {
      if (isLoggedIn) {
        this.userIsLoggedIn = true;
        this.userData$ = this.userDataStore.getUserData$();
        this.userData$.subscribe((userData) => {
          this.userId = userData.userId;
          this.userData = userData;
          this.setSelectedTabIndexFromQueryParam(tabQueryParam);
          this.setCurrentPageFromQueryParam(page, this.selectedTabIndex);
          if (this.selectedTabIndex === TabIndex.Feed) {
            this.setFeedBookmarks$(true, this.currentPageFeed);
          }
        });
      } else {
        this.setSelectedTabIndexFromQueryParam(tabQueryParam);
        this.setCurrentPageFromQueryParam(page, this.selectedTabIndex);
        if (this.selectedTabIndex === TabIndex.Feed) {
          this.setFeedBookmarks$(false, this.currentPageFeed);
        }
      }

      this.listenToClickOnLogoEvent(isLoggedIn);

      this.listenToPaginationNavigationEvents(isLoggedIn);
    });
  }

  private setSelectedTabIndexFromQueryParam(tabQueryParam) {
    switch (tabQueryParam) {
      case 'history': {
        this.selectedTabIndex = TabIndex.History;
        break;
      }
      case 'pinned': {
        this.selectedTabIndex = TabIndex.Pinned;
        break;
      }
      case 'read-later': {
        this.selectedTabIndex = TabIndex.ReadLater;
        break;
      }
      default: {
        this.selectedTabIndex = TabIndex.Feed;
      }
    }
  }

  private setFeedBookmarks$(isLoggedIn: boolean, page: number) {
    if (isLoggedIn && !this.userData?.showAllPublicInFeed) {
      this.feedBookmarks$ = this.feedStore.getFeedBookmarks$(this.userId, page);
    } else {
      this.feedBookmarks$ =
        this.publicBookmarksStore.getRecentPublicBookmarks$(page);
    }
  }

  private setCurrentPageFromQueryParam(page: string, selectedTabIndex: number) {
    if (page) {
      switch (selectedTabIndex) {
        case TabIndex.Feed:
          this.currentPageFeed = parseInt(page, 0);
          break;
        case TabIndex.History:
          this.currentPageHistory = parseInt(page, 0);
          break;
        case TabIndex.Pinned:
          this.currentPagePinned = parseInt(page, 0);
          break;
        case TabIndex.ReadLater:
          this.currentPageReadLater = parseInt(page, 0);
      }
    }
  }

  private listenToClickOnLogoEvent(isLoggedIn: boolean) {
    this.appService.logoClicked.subscribe((logoClicked) => {
      if (logoClicked) {
        this.currentPageFeed = this.FIRST_PAGE;
        this.setFeedBookmarks$(isLoggedIn, this.currentPageFeed);
      }
    });
  }

  private listenToPaginationNavigationEvents(isLoggedIn: boolean) {
    this.pageNavigationSubscription =
      this.paginationNotificationService.pageNavigationClicked$.subscribe(
        (paginationAction) => {
          if (
            paginationAction.caller === this.callerPaginationFeed &&
            this.selectedTabIndex === TabIndex.Feed
          ) {
            this.currentPageFeed = paginationAction.page;
            this.setFeedBookmarks$(isLoggedIn, this.currentPageFeed);
          }
          if (
            paginationAction.caller === this.callerPaginationHistory &&
            this.selectedTabIndex === TabIndex.History
          ) {
            this.currentPageHistory = paginationAction.page;
            this.history$ = this.userDataHistoryStore.getHistory$(
              this.userId,
              paginationAction.page
            );
          }
          if (
            paginationAction.caller === this.callerPaginationPinned &&
            this.selectedTabIndex === TabIndex.Pinned
          ) {
            this.currentPagePinned = paginationAction.page;
            this.pinned$ = this.userDataPinnedStore.getPinnedBookmarks$(
              this.userId,
              paginationAction.page
            );
          }
          if (
            paginationAction.caller === this.callerPaginationReadLater &&
            this.selectedTabIndex === TabIndex.ReadLater
          ) {
            this.currentPageReadLater = paginationAction.page;
            this.readLater$ = this.userDataReadLaterStore.getReadLater$(
              this.userId,
              paginationAction.page
            );
          }
        }
      );
  }

  tabSelectionChanged(event: MatTabChangeEvent) {
    this.selectedTabIndex = event.index;
    if (this.userIsLoggedIn) {
      switch (event.index) {
        case TabIndex.Feed:
          this.setFeedBookmarks$(this.userIsLoggedIn, this.currentPageFeed);
          break;
        case TabIndex.History:
          this.history$ = this.userDataHistoryStore.getHistory$(
            this.userId,
            this.currentPageHistory
          );
          break;
        case TabIndex.Pinned:
          this.pinned$ = this.userDataPinnedStore.getPinnedBookmarks$(
            this.userId,
            this.currentPagePinned
          );
          break;
        case TabIndex.ReadLater:
          this.readLater$ = this.userDataReadLaterStore.getReadLater$(
            this.userId,
            this.currentPageReadLater
          );
          break;
      }
    }

    const queryParamsFromIndex = this.getQueryParamsForSelectedTab(
      this.selectedTabIndex
    );
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        tab: queryParamsFromIndex.tab,
        page: queryParamsFromIndex.page,
      },
      queryParamsHandling: 'merge',
    });
  }

  login(selectedTab: string) {
    const options: Keycloak.KeycloakLoginOptions = {};
    options.redirectUri = `${environment.APP_HOME_URL}?tab=${selectedTab}`;
    this.keycloakService.login(options);
  }

  private getQueryParamsForSelectedTab(tabIndex: number): TabSwitchQueryParams {
    switch (tabIndex) {
      case TabIndex.History: {
        return { tab: 'history', page: this.currentPageHistory };
        break;
      }
      case TabIndex.Pinned: {
        return { tab: 'pinned', page: this.currentPagePinned };
        break;
      }
      case TabIndex.ReadLater: {
        return { tab: 'read-later', page: this.currentPageReadLater };
        break;
      }
      default: {
        return { tab: 'feed', page: this.currentPageFeed };
      }
    }
  }

  ngOnDestroy(): void {
    this.pageNavigationSubscription.unsubscribe();
  }

  searchPublicBookmarksByTag(tag: string) {
    this.router.navigate(['./search'], {
      queryParams: {
        q: '[' + tag + ']',
        sd: SearchDomain.PUBLIC_BOOKMARKS,
        page: this.FIRST_PAGE,
      },
    });
  }

  ngAfterViewInit(): void {
    this.userIsLoggedIn$.then((isLoggedIn) => {
      if (!isLoggedIn) {
        this.showLoginButton = true;
      }
    });
  }
}

export interface TabSwitchQueryParams {
  tab: string;
  page: number;
}

enum TabIndex {
  Feed = 0,
  History,
  Pinned,
  ReadLater,
}
