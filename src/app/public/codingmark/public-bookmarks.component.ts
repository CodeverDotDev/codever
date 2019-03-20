import {Component, NgZone, OnInit, ViewChild} from '@angular/core';
import {Observable} from 'rxjs';
import {List} from 'immutable';
import {Bookmark} from '../../core/model/bookmark';
import {ActivatedRoute} from '@angular/router';
import {BookmarkSearchComponent} from '../../shared/search/bookmark-search.component';
import {PublicBookmarksStore} from './store/public-bookmarks-store.service';
import {allTags} from '../../core/model/all-tags.const.en';
import {KeycloakService} from 'keycloak-angular';
import {UserData} from '../../core/model/user-data';
import {UserDataStore} from '../../core/user/userdata.store';


@Component({
  selector: 'app-public-codingmarks',
  templateUrl: './public-bookmarks.component.html',
  styleUrls: ['./public-bookmarks.component.scss']
})
export class PublicBookmarksComponent implements OnInit {

  publicCodingmarks$: Observable<List<Bookmark>>;
  tags: string[] = allTags;
  query = '';
  userData: UserData;

  @ViewChild(BookmarkSearchComponent)
  private searchComponent: BookmarkSearchComponent;

  constructor(private publicCodingmarksStore: PublicBookmarksStore,
              private route: ActivatedRoute,
              private keycloakService: KeycloakService,
              private userDataStore: UserDataStore
              ) { }

  ngOnInit(): void {
    this.query = this.route.snapshot.queryParamMap.get('search');
    if (!this.query) {
      this.query = this.route.snapshot.queryParamMap.get('q');
      if (this.query) {
        this.query = this.query.replace(/\+/g, ' ');
      }
    }

    this.publicCodingmarks$ = this.publicCodingmarksStore.getPublicCodingmarks();

    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.keycloakService.loadUserProfile().then(keycloakProfile => {
          this.userDataStore.getUserData().subscribe(data => {
              this.userData = data;
            },
            error => {
            }
          );
        });
      }
    });
  }

  onTagClick(tag: string) {
    this.searchComponent.setQueryFromParentComponent('[' + tag + ']');
    this.searchComponent.language = 'all';
  }
}
