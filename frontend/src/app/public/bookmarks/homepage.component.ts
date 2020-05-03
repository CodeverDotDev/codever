import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { Bookmark } from '../../core/model/bookmark';
import { ActivatedRoute, Router } from '@angular/router';
import { PublicBookmarksStore } from './store/public-bookmarks-store.service';
import { allTags } from '../../core/model/all-tags.const.en';
import { KeycloakService } from 'keycloak-angular';
import { UserData } from '../../core/model/user-data';
import { UserDataStore } from '../../core/user/userdata.store';
import { MatDialog, MatTabChangeEvent } from '@angular/material';
import { environment } from '../../../environments/environment';
import { UserInfoStore } from '../../core/user/user-info.store';
import { AppService } from '../../app.service';
import { PaginationNotificationService } from '../../core/pagination-notification.service';
import { UserDataHistoryStore } from '../../core/user/userdata.history.store';
import { UserDataPinnedStore } from '../../core/user/userdata.pinned.store';
import { UserDataReadLaterStore } from '../../core/user/user-data-read-later-store.service';
import { UserDataWatchedTagsStore } from '../../core/user/userdata.watched-tags.store';
import { TagFollowingBaseComponent } from '../../shared/tag-following-base-component/tag-following-base.component';
import { FeedStore } from '../../core/user/feed-store.service';
import { SearchDomain } from '../../core/model/search-domain.enum';


@Component({
  selector: 'app-public-bookmarks',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']
})
export class HomepageComponent extends TagFollowingBaseComponent implements OnInit, OnDestroy {

  feedBookmarks$: Observable<Bookmark[]>;
  pageNavigationSubscription: Subscription;
  tags: string[] = allTags;
  userData$: Observable<UserData>;

  history$: Observable<Bookmark[]>;
  pinned$: Observable<Bookmark[]>;
  readLater$: Observable<Bookmark[]>;

  userIsLoggedIn = false;
  userIsLoggedIn$: Promise<boolean>;

  selectedTabIndex: number;

  currentPageFeed = 1;
  currentPageHistory = 1;
  currentPagePinned = 1;
  currentPageReadLater = 1;
  callerPaginationFeed = 'feed';
  callerPaginationHistory = 'history';
  callerPaginationPinned = 'pinned';
  callerPaginationReadLater = 'read-later';
  seeAllPublicToggle = false;

  constructor(private appService: AppService,
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
              private paginationNotificationService: PaginationNotificationService,
  ) {
    super(loginDialog, userDataWatchedTagsStore);
  }

  ngOnInit(): void {
    const tabQueryParam = this.route.snapshot.queryParamMap.get('tab');
    this.userIsLoggedIn$ = this.keycloakService.isLoggedIn();
    this.userIsLoggedIn$.then(isLoggedIn => {
      if (isLoggedIn) {
        this.userIsLoggedIn = true;
        this.userInfoStore.getUserInfo$().subscribe(userInfo => {
          this.setTabIndexFromQueryParam(tabQueryParam, isLoggedIn); // this method is called twice to avoid autmatically executing changeTab events
          this.userData$ = this.userDataStore.getUserData$();
        });
      } else {
        this.setTabIndexFromQueryParam(tabQueryParam, isLoggedIn);
      }

      const page = this.route.snapshot.queryParamMap.get('page');
      this.setCurrentPageFromQueryParam(page);

      this.listenToClickOnLogoEvent(isLoggedIn);

      this.listenToPaginationNavigationEvents(isLoggedIn);

    });

  }

  private setTabIndexFromQueryParam(tabQueryParam, isLoggedIn: boolean) {
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
        this.selectedTabIndex = 0;
        if (isLoggedIn && !this.seeAllPublicToggle) {
          this.feedBookmarks$ = this.feedStore.getFeedBookmarks$(1);
        } else {
          this.feedBookmarks$ = this.publicBookmarksStore.getRecentPublicBookmarks$(1);
        }
      }
    }
  }

  private setCurrentPageFromQueryParam(page: string) {
    if (page) {
      switch (this.selectedTabIndex) {
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
    this.appService.logoClicked.subscribe(logoClicked => {
      if (logoClicked) {
        this.currentPageFeed = 1;
        if (isLoggedIn && !this.seeAllPublicToggle) {
          this.feedBookmarks$ = this.feedStore.getFeedBookmarks$(this.currentPageFeed);
        } else {
          this.feedBookmarks$ = this.publicBookmarksStore.getRecentPublicBookmarks$(this.currentPageFeed);
        }
      }
    });
  }

  private listenToPaginationNavigationEvents(isLoggedIn: boolean) {
    this.pageNavigationSubscription = this.paginationNotificationService.pageNavigationClicked$.subscribe(paginationAction => {
      if (paginationAction.caller === this.callerPaginationFeed && this.selectedTabIndex === TabIndex.Feed) {
        this.currentPageFeed = paginationAction.page;
        if (isLoggedIn && !this.seeAllPublicToggle) {
          this.feedBookmarks$ = this.feedStore.getFeedBookmarks$(paginationAction.page)
        } else {
          this.feedBookmarks$ = this.publicBookmarksStore.getRecentPublicBookmarks$(paginationAction.page);
        }
      }
      if (paginationAction.caller === this.callerPaginationHistory && this.selectedTabIndex === TabIndex.History) {
        this.currentPageHistory = paginationAction.page;
        this.history$ = this.userDataHistoryStore.getHistory$(paginationAction.page);
      }
      if (paginationAction.caller === this.callerPaginationPinned && this.selectedTabIndex === TabIndex.Pinned) {
        this.currentPagePinned = paginationAction.page;
        this.pinned$ = this.userDataPinnedStore.getPinnedBookmarks$(paginationAction.page);
      }
      if (paginationAction.caller === this.callerPaginationReadLater && this.selectedTabIndex === TabIndex.ReadLater) {
        this.currentPageReadLater = paginationAction.page;
        this.readLater$ = this.userDataReadLaterStore.getReadLater$(paginationAction.page);
      }
    });
  }

  tabSelectionChanged(event: MatTabChangeEvent) {
    this.selectedTabIndex = event.index;
    if (this.userIsLoggedIn) {
      switch (event.index) {
        case TabIndex.Feed:
          if (this.userIsLoggedIn && !this.seeAllPublicToggle) {
            this.feedBookmarks$ = this.feedStore.getFeedBookmarks$(this.currentPageFeed);
          } else {
            this.feedBookmarks$ = this.publicBookmarksStore.getRecentPublicBookmarks$(this.currentPageFeed);
          }
          break;
        case TabIndex.History:
          this.history$ = this.userDataHistoryStore.getHistory$(this.currentPageHistory);
          break;
        case TabIndex.Pinned:
          this.pinned$ = this.userDataPinnedStore.getPinnedBookmarks$(this.currentPagePinned);
          break;
        case TabIndex.ReadLater:
          this.readLater$ = this.userDataReadLaterStore.getReadLater$(this.currentPageReadLater);
          break;
      }
    }

    const queryParamsFromIndex = this.getQueryParamsForTabIndex(this.selectedTabIndex);
    this.router.navigate(['.'],
      {
        relativeTo: this.route,
        queryParams: {
          tab: queryParamsFromIndex.tab,
          page: queryParamsFromIndex.page
        },
        queryParamsHandling: 'merge'
      }
    );
  }

  login(selectedTab: string) {
    const options: Keycloak.KeycloakLoginOptions = {};
    options.redirectUri = `${environment.APP_HOME_URL}?tab=${selectedTab}`;
    this.keycloakService.login(options);
  }

  private getQueryParamsForTabIndex(tabIndex: number): TabSwitchQueryParams {
    switch (tabIndex) {
      case TabIndex.History: {
        return {tab: 'history', page: this.currentPageHistory}
        break;
      }
      case TabIndex.Pinned: {
        return {tab: 'pinned', page: this.currentPagePinned};
        break;
      }
      case TabIndex.ReadLater : {
        return {tab: 'read-later', page: this.currentPageReadLater};
        break;
      }
      default: {
        return {tab: 'feed', page: this.currentPageFeed};
      }
    }
  }

  ngOnDestroy(): void {
    this.pageNavigationSubscription.unsubscribe();
  }

  seeAllPublic(seeAllPublicToggle: boolean) {
    if (seeAllPublicToggle) {
      this.feedBookmarks$ = this.publicBookmarksStore.getRecentPublicBookmarks$(1);
      this.seeAllPublicToggle = true;
    } else {
      this.feedBookmarks$ = this.feedStore.getFeedBookmarks$(1);
      this.seeAllPublicToggle = false;
    }

  }

  searchPublicBookmarksByTag(tag: string) {
    this.router.navigate(['./search'],
      {
        queryParams: {q: '[' + tag + ']', sd: SearchDomain.PUBLIC_BOOKMARKS, page: 1}
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
  ReadLater
}
