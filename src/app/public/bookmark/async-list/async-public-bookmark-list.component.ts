import {Component, Input, OnInit, Injector} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Bookmark} from '../../../core/model/bookmark';
import {KeycloakService} from '../../../core/keycloak/keycloak.service';
import {ActivatedRoute, Router} from '@angular/router';
import {PersonalBookmarksStore} from '../../../core/store/PersonalBookmarksStore';
import {BookmarkStore} from '../store/BookmarkStore';
import {BookmarkService} from '../bookmark.service';

@Component({
  selector: 'my-async-public-bookmark-list',
  templateUrl: './async-public-bookmark-list.component.html',
  styleUrls: ['./async-public-bookmark-list.component.scss']
})
export class AsyncPublicBookmarksListComponent  implements OnInit {

  userId: string;

  @Input()
  bookmarks: Observable<Bookmark[]>;

  @Input()
  queryText: string;

  private route: ActivatedRoute;
  private router: Router;
  private userBookmarkStore: PersonalBookmarksStore;
  private publicBookmarkStore: BookmarkStore;
  private bookmarkService: BookmarkService;
  private keycloakService: KeycloakService;

  displayModal = 'none';

  constructor(
    private injector: Injector,
) {
    this.route = <ActivatedRoute>this.injector.get(ActivatedRoute);
    this.router = <Router>this.injector.get(Router);
    this.publicBookmarkStore = <BookmarkStore>this.injector.get(BookmarkStore);
    this.keycloakService = <KeycloakService>this.injector.get(KeycloakService);
    this.bookmarkService = <BookmarkService>this.injector.get(BookmarkService);

    if (this.keycloakService.isLoggedIn()) {
      this.userBookmarkStore = <PersonalBookmarksStore>this.injector.get(PersonalBookmarksStore);
    }
  }

  ngOnInit(): void {
    if (this.keycloakService.isLoggedIn()) {
      this.userId = this.keycloakService.getKeycloak().subject;
    }
  }

  /**
   *
   * @param bookmark
   */
  gotoDetail(bookmark: Bookmark): void {
    const link = ['./personal/bookmarks', bookmark._id];
    this.router.navigate(link, { relativeTo: this.route });
  }

  deleteBookmark(bookmark: Bookmark): void {
    const obs = this.userBookmarkStore.deleteBookmark(bookmark);
    const obs2 = this.publicBookmarkStore.removeFromPublicStore(bookmark);
  }

  starBookmark(bookmark: Bookmark): void {
    if (!this.keycloakService.isLoggedIn()) {
      this.displayModal = 'block';
    }
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
