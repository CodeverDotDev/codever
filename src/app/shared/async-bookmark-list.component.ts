import {Component, Injector, Input, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {Bookmark} from '../core/model/bookmark';
import {Router} from '@angular/router';
import {PersonalCodingmarksStore} from '../core/store/personal-codingmarks-store.service';
import {KeycloakService} from 'keycloak-angular';
import {PublicBookmarksService} from '../public/bookmark/public-bookmarks.service';
import {PublicBookmarksStore} from '../public/bookmark/store/public-bookmarks.store';

@Component({
  selector: 'app-async-bookmark-list',
  templateUrl: './async-bookmark-list.component.html',
    styleUrls: [ './async-bookmark-list.component.scss' ]
})
export class AsyncBookmarkListComponent  implements OnInit {

  @Input()
  userId: string;

  @Input()
  bookmarks: Observable<Bookmark[]>;

  @Input()
  queryText: string;

  @Input()
  shownSize: number;

  private router: Router;
  private userBookmarkStore: PersonalCodingmarksStore;
  private publicBookmarkStore: PublicBookmarksStore;
  private bookmarkService: PublicBookmarksService;
  private keycloakService: KeycloakService;

  displayModal = 'none';

  constructor(
    private injector: Injector,
) {
    this.router = <Router>this.injector.get(Router);
    this.publicBookmarkStore = <PublicBookmarksStore>this.injector.get(PublicBookmarksStore);
    this.keycloakService = <KeycloakService>this.injector.get(KeycloakService);
    this.bookmarkService = <PublicBookmarksService>this.injector.get(PublicBookmarksService);

    if (this.keycloakService.isLoggedIn()) {
      this.userBookmarkStore = <PersonalCodingmarksStore>this.injector.get(PersonalCodingmarksStore);
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

  deleteBookmark(bookmark: Bookmark): void {
    const obs = this.userBookmarkStore.deleteBookmark(bookmark);
    const obs2 = this.publicBookmarkStore.removeFromPublicStore(bookmark);
  }

  starBookmark(bookmark: Bookmark): void {

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
      this.updateBookmark(bookmark);
    }
  }

  unstarBookmark(bookmark: Bookmark): void {
    if (this.userId) {
      if (!bookmark.starredBy) {
        bookmark.starredBy = [];
      } else {
        const index = bookmark.starredBy.indexOf(this.userId);
        bookmark.starredBy.splice(index, 1);
      }
      this.updateBookmark(bookmark);

    }
  }

  updateLastAccess(bookmark: Bookmark) {
    if (this.userId === bookmark.userId) {
      bookmark.lastAccessedAt = new Date();
      const obs = this.userBookmarkStore.updateBookmark(bookmark);
    }
  }

  private updateBookmark(bookmark: Bookmark) {
    if (this.userId === bookmark.userId) {
      const obs = this.userBookmarkStore.updateBookmark(bookmark);
    } else {
      const obs = this.bookmarkService.updateBookmark(bookmark);
      obs.subscribe(
        res => {
          this.publicBookmarkStore.updateBookmark(bookmark);
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
