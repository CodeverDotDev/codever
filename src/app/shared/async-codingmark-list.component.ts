import {Component, Injector, Input, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {Bookmark} from '../core/model/bookmark';
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
  bookmarks: Observable<Bookmark[]>;

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
  gotoDetail(bookmark: Bookmark): void {
    const link = ['./personal/bookmarks', bookmark._id];
    this.router.navigate(link);
  }

  deleteCodingmark(bookmark: Bookmark): void {
    const obs = this.personalCodingmarksStore.deleteBookmark(bookmark);
    const obs2 = this.publicCodingmarksStore.removeFromPublicStore(bookmark);
  }

  starCodingmark(bookmark: Bookmark): void {

    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (!isLoggedIn) {
        this.displayModal = 'block';
      }
    });

    if (this.userId) {
      if (!bookmark.starredBy) {
        bookmark.starredBy = [];
      } else {
        bookmark.starredBy.push(this.userId);
      }
      this.updateCodingmark(bookmark);
    }
  }

  unstarCodingmark(bookmark: Bookmark): void {
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

  updateLastAccess(bookmark: Bookmark) {
    if (this.userId === bookmark.userId) {
      bookmark.lastAccessedAt = new Date();
      const obs = this.personalCodingmarksStore.updateBookmark(bookmark);
    }
  }

  private updateCodingmark(bookmark: Bookmark) {
    if (this.userId === bookmark.userId) {
      const obs = this.personalCodingmarksStore.updateBookmark(bookmark);
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
