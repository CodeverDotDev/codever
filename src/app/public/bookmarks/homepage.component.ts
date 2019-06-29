import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { List } from 'immutable';
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


@Component({
  selector: 'app-public-bookmarks',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']
})
export class HomepageComponent implements OnInit {

  publicBookmarks$: Observable<List<Bookmark>>;
  tags: string[] = allTags;
  userData$: Observable<UserData>;
  counter = 20;

  @ViewChild(BookmarksSearchComponent)
  private searchComponent: BookmarksSearchComponent;

  history$: Observable<Bookmark[]>;
  pinned$: Observable<Bookmark[]>;
  favorites$: Observable<Bookmark[]>;
  laterReads$: Observable<Bookmark[]>;
  bookmarksForWatchedTags$: Observable<Bookmark[]>;

  userIsLoggedIn = false;
  userIsLoggedIn$: Promise<boolean>;

  selectedIndex: number;

  constructor(private publicBookmarksStore: PublicBookmarksStore,
              private router: Router,
              private route: ActivatedRoute,
              private keycloakService: KeycloakService,
              private userDataStore: UserDataStore,
              private userInfoStore: UserInfoStore
  ) {
  }

  ngOnInit(): void {
    const selectedTab = this.route.snapshot.queryParamMap.get('tab');
    this.userIsLoggedIn$ = this.keycloakService.isLoggedIn();
    this.userIsLoggedIn$.then(isLoggedIn => {
      if (isLoggedIn) {
        this.userIsLoggedIn = true;
        this.userInfoStore.getUserInfo$().subscribe( userInfo => {
          this.selectTabWhenLoggedIn(selectedTab);
          this.userData$ = this.userDataStore.getUserData$();
        });
        // this.userData$ = this.userDataStore.getUserData$();
      } else {
        this.selectedTabWhenNotLoggedIn(selectedTab);
      }
    });

  }

  private selectTabWhenLoggedIn(selectedTab) {
    switch (selectedTab) {
      case 'history': {
        this.selectedIndex = 1;
        break;
      }
      case 'pinned': {
        this.selectedIndex = 2;
        break;
      }
      case 'read-later': {
        this.selectedIndex = 3;
        break;
      }
      case 'favorites': {
        this.selectedIndex = 4;
        break;
      }
      case 'watched-tags': {
        this.selectedIndex = 5;
        break;
      }
      default: {
        this.selectedIndex = 0;
        this.publicBookmarks$ = this.publicBookmarksStore.getRecentPublicBookmarks$();
      }
    }
  }

  private selectedTabWhenNotLoggedIn(selectedTab) {
    switch (selectedTab) {
      case 'history': {
        this.selectedIndex = 1;
        break;
      }
      case 'pinned': {
        this.selectedIndex = 2;
        break;
      }
      case 'read-later': {
        this.selectedIndex = 3;
        break;
      }
      case 'favorites': {
        this.selectedIndex = 4;
        break;
      }
      case 'watched-tags': {
        this.selectedIndex = 5;
        break;
      }
      default: {
        this.selectedIndex = 0;
        this.publicBookmarks$ = this.publicBookmarksStore.getRecentPublicBookmarks$();
      }
    }
  }

  showMoreResults() {
    this.counter += 20;
  }

  tabSelectionChanged(event: MatTabChangeEvent) {
    this.selectedIndex = event.index;
    if (this.userIsLoggedIn) {
      if (event.index === 0) {
        this.publicBookmarks$ = this.publicBookmarksStore.getRecentPublicBookmarks$();
      } else if (event.index === 1) {
        this.history$ = this.userDataStore.getHistory$();
      } else if (event.index === 2) {
        this.pinned$ = this.userDataStore.getPinnedBookmarks$();
      } else if (event.index === 3) {
        this.laterReads$ = this.userDataStore.getLaterReads$();
      } else if (event.index === 4) {
        this.favorites$ = this.userDataStore.getFavoriteBookmarks$();
      } else if (event.index === 5) {
        this.bookmarksForWatchedTags$ = this.userDataStore.getBookmarksForWatchedTags$();
      }
    }

    this.router.navigate(['.'],
      {
        relativeTo: this.route,
        queryParams: {tab: this.getTabFromIndex(this.selectedIndex)},
        queryParamsHandling: 'merge'
      }
    );
  }

  login(selectedTab: string) {
    const options: Keycloak.KeycloakLoginOptions = {};
    options.redirectUri = `${environment.APP_HOME_URL}?tab=${selectedTab}`;
    this.keycloakService.login(options);
  }

  private getTabFromIndex(selectedIndex: number) {
    switch (selectedIndex) {
      case 1: {
        return 'history'
        break;
      }
      case 2: {
        return 'pinned';
        break;
      }
      case 3 : {
        return 'read-later'
        break;
      }
      case 4 : {
        return 'favorites'
        break;
      }
      case 5 : {
        return 'watched-tags';
        break;
      }
      default: {
        return 'community';
      }
    }
  }
}
