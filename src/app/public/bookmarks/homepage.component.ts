import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { Bookmark } from '../../core/model/bookmark';
import { ActivatedRoute, Router } from '@angular/router';
import { PublicBookmarksStore } from './store/public-bookmarks-store.service';
import { allTags } from '../../core/model/all-tags.const.en';
import { KeycloakService } from 'keycloak-angular';
import { UserData } from '../../core/model/user-data';
import { UserDataStore } from '../../core/user/userdata.store';
import { BookmarksSearchComponent } from '../search/bookmarks-search.component';
import { MatTabChangeEvent } from '@angular/material';
import { environment } from '../../../environments/environment';
import { UserInfoStore } from '../../core/user/user-info.store';
import { AppService } from '../../app.service';
import { PaginationNotificationService } from '../../core/pagination-notification.service';
import { UserDataHistoryStore } from '../../core/user/userdata.history.store';
import { UserDataPinnedStore } from '../../core/user/userdata.pinned.store';
import { UserDataReadLaterStore } from '../../core/user/user-data-read-later-store.service';
import { UserDataFavoritesStore } from '../../core/user/userdata.favorites.store';
import { UserDataWatchedTagsStore } from '../../core/user/userdata.watched-tags.store';


@Component({
  selector: 'app-public-bookmarks',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']
})
export class HomepageComponent implements OnInit {

  publicBookmarks$: Observable<Bookmark[]>;
  tags: string[] = allTags;
  userData$: Observable<UserData>;

  @ViewChild(BookmarksSearchComponent, {static: true})
  searchComponent: BookmarksSearchComponent;

  history$: Observable<Bookmark[]>;
  pinned$: Observable<Bookmark[]>;
  favorites$: Observable<Bookmark[]>;
  readLater$: Observable<Bookmark[]>;
  bookmarksForWatchedTags$: Observable<Bookmark[]>;

  userIsLoggedIn = false;
  userIsLoggedIn$: Promise<boolean>;

  selectedTabIndex: number;

  currentPageCommunity = 1;
  currentPageHistory = 1;
  currentPagePinned = 1;
  currentPageReadLater = 1;
  currentPageFavorites = 1;
  currentPageWatchedTags = 1;
  callerPaginationCommunity = 'community';
  callerPaginationHistory = 'history';
  callerPaginationPinned = 'pinned';
  callerPaginationReadLater = 'read-later';
  callerPaginationFavorites = 'favorites';
  callerPaginationWatchedTags = 'watched-tags';

  constructor(private appService: AppService,
              private publicBookmarksStore: PublicBookmarksStore,
              private router: Router,
              private route: ActivatedRoute,
              private keycloakService: KeycloakService,
              private userDataStore: UserDataStore,
              private userDataHistoryStore: UserDataHistoryStore,
              private userDataPinnedStore: UserDataPinnedStore,
              private userDataReadLaterStore: UserDataReadLaterStore,
              private userDataFavoritesStore: UserDataFavoritesStore,
              private userDataWatchedTagsStore: UserDataWatchedTagsStore,
              private userInfoStore: UserInfoStore,
              private paginationNotificationService: PaginationNotificationService,
  ) {
  }

  ngOnInit(): void {
    const tabQueryParam = this.route.snapshot.queryParamMap.get('tab');
    this.userIsLoggedIn$ = this.keycloakService.isLoggedIn();
    this.userIsLoggedIn$.then(isLoggedIn => {
      if (isLoggedIn) {
        this.userIsLoggedIn = true;
        this.userInfoStore.getUserInfo$().subscribe(userInfo => {
          this.setTabIndexFromQueryParam(tabQueryParam); // this method is called twice to avoid autmatically executing changeTab events
          this.userData$ = this.userDataStore.getUserData$();
        });
      } else {
        this.setTabIndexFromQueryParam(tabQueryParam);
      }

      const page = this.route.snapshot.queryParamMap.get('page');
      this.setCurrentPageFromQueryParam(page);

    });

    this.listenToClickOnLogoEvent();

    this.listenToPaginationNavigationEvents();
  }

  private setTabIndexFromQueryParam(tabQueryParam) {
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
      case 'favorites': {
        this.selectedTabIndex = TabIndex.Favorites;
        break;
      }
      case 'watched-tags': {
        this.selectedTabIndex = TabIndex.WatchedTags;
        break;
      }
      case 'search-results': {
        this.selectedTabIndex = TabIndex.SearchResults;
        break;
      }
      default: {
        this.selectedTabIndex = 0;
        this.publicBookmarks$ = this.publicBookmarksStore.getRecentPublicBookmarks$(1);
      }
    }
  }

  private setCurrentPageFromQueryParam(page: string) {
    if (page) {
      switch (this.selectedTabIndex) {
        case TabIndex.Community:
          this.currentPageCommunity = parseInt(page, 0);
          break;
        case TabIndex.History:
          this.currentPageHistory = parseInt(page, 0);
          break;
        case TabIndex.Pinned:
          this.currentPagePinned = parseInt(page, 0);
          break;
        case TabIndex.ReadLater:
          this.currentPageReadLater = parseInt(page, 0);
          break;
        case TabIndex.Favorites:
          this.currentPageFavorites = parseInt(page, 0);
          break;
        case TabIndex.WatchedTags:
          this.currentPageWatchedTags = parseInt(page, 0);
          break;
        case TabIndex.SearchResults:
          this.searchComponent.currentPage = parseInt(page, 0);
      }
    }
  }

  private listenToClickOnLogoEvent() {
    this.appService.logoClicked.subscribe(logoClicked => {
      if (logoClicked) {
        this.currentPageCommunity = 1;
        this.publicBookmarks$ = this.publicBookmarksStore.getRecentPublicBookmarks$(this.currentPageCommunity);
        this.searchComponent.clearSearchText();
      }
    });
  }

  private listenToPaginationNavigationEvents() {
    this.paginationNotificationService.pageNavigationClicked$.subscribe(paginationAction => {
      if (paginationAction.caller === this.callerPaginationCommunity && this.selectedTabIndex === TabIndex.Community) {
        this.currentPageCommunity = paginationAction.page;
        this.publicBookmarks$ = this.publicBookmarksStore.getRecentPublicBookmarks$(paginationAction.page);
      }
      if (paginationAction.caller === this.callerPaginationHistory && this.selectedTabIndex === TabIndex.History) {
        this.currentPageHistory = paginationAction.page;
        this.publicBookmarks$ = this.userDataHistoryStore.getHistory$(paginationAction.page);
      }
      if (paginationAction.caller === this.callerPaginationPinned && this.selectedTabIndex === TabIndex.Pinned) {
        this.currentPagePinned = paginationAction.page;
        this.pinned$ = this.userDataPinnedStore.getPinnedBookmarks$(paginationAction.page);
      }
      if (paginationAction.caller === this.callerPaginationReadLater && this.selectedTabIndex === TabIndex.ReadLater) {
        this.currentPageReadLater = paginationAction.page;
        this.readLater$ = this.userDataReadLaterStore.getReadLater$(paginationAction.page);
      }
      if (paginationAction.caller === this.callerPaginationFavorites && this.selectedTabIndex === TabIndex.Favorites) {
        this.currentPageFavorites = paginationAction.page;
        this.favorites$ = this.userDataFavoritesStore.getFavoriteBookmarks$(paginationAction.page);
      }
      if (paginationAction.caller === this.callerPaginationWatchedTags && this.selectedTabIndex === TabIndex.WatchedTags) {
        this.currentPageWatchedTags = paginationAction.page;
        this.favorites$ = this.userDataWatchedTagsStore.getBookmarksForWatchedTags$(paginationAction.page);
      }
    });
  }

  tabSelectionChanged(event: MatTabChangeEvent) {
    this.selectedTabIndex = event.index;
    if (this.userIsLoggedIn) {
      switch (event.index) {
        case TabIndex.Community:
          this.publicBookmarks$ = this.publicBookmarksStore.getRecentPublicBookmarks$(this.currentPageCommunity);
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
        case TabIndex.Favorites:
          this.favorites$ = this.userDataFavoritesStore.getFavoriteBookmarks$(this.currentPageFavorites);
          break;
        case TabIndex.WatchedTags:
          this.bookmarksForWatchedTags$ = this.userDataWatchedTagsStore.getBookmarksForWatchedTags$(this.currentPageWatchedTags);
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
      case TabIndex.Favorites : {
        return {tab: 'favorites', page: this.currentPageFavorites};
        break;
      }
      case TabIndex.WatchedTags : {
        return {tab: 'watched-tags', page: this.currentPageWatchedTags};
        break;
      }
      case TabIndex.SearchResults: {
        return {tab: 'search-results', page: this.searchComponent.currentPage};
        break;
      }
      default: {
        return {tab: 'community', page: this.currentPageCommunity};
      }
    }
  }

  onSearchTriggered(searchTriggered: boolean) {
    if (searchTriggered) {
      this.selectedTabIndex = TabIndex.SearchResults;
    }
  }

  onClearSearchText(searchTextCleared: boolean) {
    if (searchTextCleared) {
      this.selectedTabIndex = TabIndex.Community;
    }
  }

}

export interface TabSwitchQueryParams {
  tab: string;
  page: number;
}

enum TabIndex {
  Community = 0,
  History,
  Pinned,
  ReadLater,
  Favorites,
  WatchedTags,
  SearchResults
}
