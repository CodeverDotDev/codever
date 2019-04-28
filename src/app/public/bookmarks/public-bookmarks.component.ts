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
import { PublicBookmarkSearchComponent } from '../search/public-bookmark-search.component';
import { MatTabChangeEvent } from '@angular/material';
import { WatchedTagsComponent } from '../../shared/watched-tags/watched-tags.component';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-public-bookmarks',
  templateUrl: './public-bookmarks.component.html',
  styleUrls: ['./public-bookmarks.component.scss']
})
export class PublicBookmarksComponent implements OnInit {

  publicBookmarks$: Observable<List<Bookmark>>;
  tags: string[] = allTags;
  query = '';
  userData: UserData;
  counter = 20;

  @ViewChild(PublicBookmarkSearchComponent)
  private searchComponent: PublicBookmarkSearchComponent;

  pinned$: Observable<Bookmark[]>;
  laterReads$: Observable<Bookmark[]>;
  starredBookmarks$: Observable<Bookmark[]>;
  bookmarksForWatchedTags$: Observable<Bookmark[]>;

  userIsLoggedIn = false;

  constructor(private publicBookmarksStore: PublicBookmarksStore,
              private route: ActivatedRoute,
              private keycloakService: KeycloakService,
              private userDataStore: UserDataStore
  ) {
  }

  ngOnInit(): void {
    this.query = this.route.snapshot.queryParamMap.get('search');
    if (!this.query) {
      this.query = this.route.snapshot.queryParamMap.get('q');
      if (this.query) {
        this.query = this.query.replace(/\+/g, ' ');
      }
    }

    this.publicBookmarks$ = this.publicBookmarksStore.getPublicBookmarks();

    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.keycloakService.loadUserProfile().then(keycloakProfile => {
          this.userDataStore.getUserData().subscribe(data => {
              this.userIsLoggedIn = true;
              this.userData = data;
            },
            error => {
            }
          );
        });
      }
    });
  }

  showMoreResults() {
    this.counter += 20;
  }

  tabSelectionChanged(event: MatTabChangeEvent) {
    if (this.userIsLoggedIn) {
      if (event.index === 1) {
        this.pinned$ = this.userDataStore.getPinnedBookmarks();
      } else if (event.index === 2) {
        this.laterReads$ = this.userDataStore.getLaterReads();
      } else if (event.index === 3) {
        this.starredBookmarks$ = this.userDataStore.getStarredBookmarks();
      } else if (event.index === 4) {
        this.bookmarksForWatchedTags$ = this.userDataStore.getBookmarksForWatchedTags();
      }
    }

  }

  login() {
    const options: Keycloak.KeycloakLoginOptions = {};
    options.redirectUri = environment.APP_HOME_URL;
    this.keycloakService.login(options).then(() => this.userIsLoggedIn = true);
  }
}
