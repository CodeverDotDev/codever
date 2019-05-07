import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { List } from 'immutable';
import { Bookmark } from '../../core/model/bookmark';
import { ActivatedRoute } from '@angular/router';
import { PublicBookmarksStore } from './store/public-bookmarks-store.service';
import { allTags } from '../../core/model/all-tags.const.en';
import { KeycloakService } from 'keycloak-angular';
import { UserData } from '../../core/model/user-data';
import { UserDataStore } from '../../core/user/userdata.store';
import { BookmarksSearchComponent } from '../search/bookmarks-search.component';
import { MatTabChangeEvent } from '@angular/material';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-public-bookmarks',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss']
})
export class HomepageComponent implements OnInit {

  publicBookmarks$: Observable<List<Bookmark>>;
  tags: string[] = allTags;
  userData: UserData;
  counter = 20;

  @ViewChild(BookmarksSearchComponent)
  private searchComponent: BookmarksSearchComponent;

  history$: Observable<Bookmark[]>;
  pinned$: Observable<Bookmark[]>;
  laterReads$: Observable<Bookmark[]>;
  starredBookmarks$: Observable<Bookmark[]>;
  bookmarksForWatchedTags$: Observable<Bookmark[]>;

  userIsLoggedIn = false;
  userIsLoggedInPromise: Promise<boolean>;

  selectedIndex: number;

  constructor(private publicBookmarksStore: PublicBookmarksStore,
              private route: ActivatedRoute,
              private keycloakService: KeycloakService,
              private userDataStore: UserDataStore
  ) {
  }

  ngOnInit(): void {
    const selectedTab = this.route.snapshot.queryParamMap.get('tab');
    this.userIsLoggedInPromise = this.keycloakService.isLoggedIn();
    this.userIsLoggedInPromise.then(isLoggedIn => {
      if (isLoggedIn) {
        this.keycloakService.loadUserProfile().then(keycloakProfile => {
          this.userIsLoggedIn = true;
          this.userDataStore.getUserData().subscribe(data => {
              this.userData = data;
              this.selectTabWhenLoggedIn(selectedTab);
            },
            error => {
            }
          );
        });
      } else {
        this.selectedTabWhenNotLoggedIn(selectedTab);
      }
    });

  }

  private selectTabWhenLoggedIn(selectedTab) {
    switch (selectedTab) {
      case 'history': {

        this.selectedIndex = 1;
        this.history$ = this.userDataStore.getHistory();
        break;
      }
      case 'pinned': {
        this.selectedIndex = 2;
        this.pinned$ = this.userDataStore.getPinnedBookmarks();
        break;
      }
      case 'read-later': {
        this.selectedIndex = 3;
        this.laterReads$ = this.userDataStore.getLaterReads();
        break;
      }
      case 'starred': {
        this.selectedIndex = 4;
        this.starredBookmarks$ = this.userDataStore.getStarredBookmarks();
        break;
      }
      case 'watched-tags': {
        this.selectedIndex = 5;
        this.bookmarksForWatchedTags$ = this.userDataStore.getBookmarksForWatchedTags();
        break;
      }
      default: {
        this.selectedIndex = 0;
        this.publicBookmarks$ = this.publicBookmarksStore.getRecentPublicBookmarks();
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
        this.pinned$ = this.userDataStore.getPinnedBookmarks();
        break;
      }
      case 'read-later': {
        this.selectedIndex = 3;
        this.laterReads$ = this.userDataStore.getLaterReads();
        break;
      }
      case 'starred': {
        this.selectedIndex = 4;
        this.starredBookmarks$ = this.userDataStore.getStarredBookmarks();
        break;
      }
      case 'watched-tags': {
        this.selectedIndex = 5;
        this.bookmarksForWatchedTags$ = this.userDataStore.getBookmarksForWatchedTags();
        break;
      }
      default: {
        this.selectedIndex = 0;
        this.publicBookmarks$ = this.publicBookmarksStore.getRecentPublicBookmarks();
      }
    }
  }

  showMoreResults() {
    this.counter += 20;
  }

  tabSelectionChanged(event: MatTabChangeEvent) {
    if (this.userIsLoggedIn) {
      if (event.index === 0) {
        this.publicBookmarks$ = this.publicBookmarksStore.getRecentPublicBookmarks();
      } else if (event.index === 1) {
        this.history$ = this.userDataStore.getHistory();
      } else if (event.index === 2) {
        this.pinned$ = this.userDataStore.getPinnedBookmarks();
      } else if (event.index === 3) {
        this.laterReads$ = this.userDataStore.getLaterReads();
      } else if (event.index === 4) {
        this.starredBookmarks$ = this.userDataStore.getStarredBookmarks();
      } else if (event.index === 5) {
        this.bookmarksForWatchedTags$ = this.userDataStore.getBookmarksForWatchedTags();
      }
    }
  }

  login(selectedTab: string) {
    const options: Keycloak.KeycloakLoginOptions = {};
    options.redirectUri = `${environment.APP_HOME_URL}?tab=${selectedTab}`;
    this.keycloakService.login(options);
  }
}
