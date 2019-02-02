import {Component, NgZone, OnInit, ViewChild} from '@angular/core';
import {Observable} from 'rxjs';
import {List} from 'immutable';
import {Codingmark} from '../../core/model/codingmark';
import {ActivatedRoute} from '@angular/router';
import {CodingmarkSearchComponent} from '../../shared/search/codingmark-search.component';
import {PublicCodingmarksStore} from './store/public-codingmarks-store.service';
import {allTags} from '../../core/model/all-tags.const.en';
import {KeycloakService} from 'keycloak-angular';
import {UserData} from '../../core/model/user-data';
import {UserDataStore} from '../../core/user/userdata.store';


@Component({
  selector: 'app-public-codingmarks',
  templateUrl: './public-codingmarks.component.html',
  styleUrls: ['./public-codingmarks.component.scss']
})
export class PublicCodingmarksComponent implements OnInit {

  publicCodingmarks$: Observable<List<Codingmark>>;
  tags: string[] = allTags;
  query = '';
  userData: UserData;

  @ViewChild(CodingmarkSearchComponent)
  private searchComponent: CodingmarkSearchComponent;

  constructor(private publicCodingmarksStore: PublicCodingmarksStore,
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

    this.keycloakService.isLoggedIn().then(value => {
      this.keycloakService.loadUserProfile().then(keycloakProfile => {
        this.userDataStore.getUserData().subscribe(data => {
            this.userData = data;
          },
          error => {
          }
        );
      });
    });
  }

  onTagClick(tag: string) {
    this.searchComponent.setQueryFromParentComponent('[' + tag + ']');
    this.searchComponent.language = 'all';
  }
}
