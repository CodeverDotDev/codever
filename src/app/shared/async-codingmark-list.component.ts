import {Component, Injector, Input, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {Codingmark} from '../core/model/codingmark';
import {Router} from '@angular/router';
import {PersonalCodingmarksStore} from '../core/store/personal-codingmarks-store.service';
import {KeycloakService} from 'keycloak-angular';
import {PublicCodingmarksStore} from '../public/bookmark/store/public-codingmarks-store.service';
import {PublicCodingmarksService} from '../public/bookmark/public-codingmarks.service';

@Component({
  selector: 'app-async-codingmark-list',
  templateUrl: './async-codingmark-list.component.html',
    styleUrls: [ './async-codingmark-list.component.scss' ]
})
export class AsyncCodingmarkListComponent  implements OnInit {

  @Input()
  userId: string;

  @Input()
  bookmarks: Observable<Codingmark[]>;

  @Input()
  queryText: string;

  @Input()
  shownSize: number;

  private router: Router;
  private personalCodingmarksStore: PersonalCodingmarksStore;
  private publicCodingmarksStore: PublicCodingmarksStore;
  private publicCodingmarksService: PublicCodingmarksService;
  private keycloakService: KeycloakService;

  displayModal = 'none';

  constructor(
    private injector: Injector,
) {
    this.router = <Router>this.injector.get(Router);
    this.publicCodingmarksStore = <PublicCodingmarksStore>this.injector.get(PublicCodingmarksStore);
    this.keycloakService = <KeycloakService>this.injector.get(KeycloakService);
    this.publicCodingmarksService = <PublicCodingmarksService>this.injector.get(PublicCodingmarksService);

    if (this.keycloakService.isLoggedIn()) {
      this.personalCodingmarksStore = <PersonalCodingmarksStore>this.injector.get(PersonalCodingmarksStore);
    }
  }

  ngOnInit(): void {
    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.keycloakService.loadUserProfile().then( keycloakProfile => {
          this.userId = keycloakProfile.id;
        });
      }
    });
  }

  /**
   *
   * @param bookmark
   */
  gotoDetail(bookmark: Codingmark): void {
    const link = ['./personal/bookmarks', bookmark._id];
    this.router.navigate(link);
  }

  deleteCodingmark(bookmark: Codingmark): void {
    const obs = this.personalCodingmarksStore.deleteCodingmark(bookmark);
    const obs2 = this.publicCodingmarksStore.removeFromPublicStore(bookmark);
  }

  starCodingmark(codingmark: Codingmark): void {

    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (!isLoggedIn) {
        this.displayModal = 'block';
      }
    });

    if (this.userId) {
      if (!codingmark.starredBy) {
        codingmark.starredBy = [];
      } else {
        codingmark.starredBy.push(this.userId);
      }
      this.updateCodingmark(codingmark);
    }
  }

  unstarCodingmark(bookmark: Codingmark): void {
    if (this.userId) {
      if (!bookmark.starredBy) {
        bookmark.starredBy = [];
      } else {
        const index = bookmark.starredBy.indexOf(this.userId);
        bookmark.starredBy.splice(index, 1);
      }
      this.updateCodingmark(bookmark);

    }
  }

  updateLastAccess(codingmark: Codingmark) {
    if (this.userId === codingmark.userId) {
      codingmark.lastAccessedAt = new Date();
      const obs = this.personalCodingmarksStore.updateCodingmark(codingmark);
    }
  }

  private updateCodingmark(bookmark: Codingmark) {
    if (this.userId === bookmark.userId) {
      const obs = this.personalCodingmarksStore.updateCodingmark(bookmark);
    } else {
      const obs = this.publicCodingmarksService.updateCodingmark(bookmark);
      obs.subscribe(
        res => {
          this.publicCodingmarksStore.updateBookmark(bookmark);
        }
      );
    }
  }


  onLoginClick() {
    this.keycloakService.login();
  }

  onCancelClick() {
    this.displayModal = 'none';
  }
}
