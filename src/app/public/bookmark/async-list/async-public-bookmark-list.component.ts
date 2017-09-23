import {Component, Input, OnInit} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Bookmark} from '../../../core/model/bookmark';
import {KeycloakService} from '../../../core/keycloak/keycloak.service';
import {ActivatedRoute, Router} from '@angular/router';
import {PersonalBookmarksStore} from '../../../core/store/PersonalBookmarksStore';
import {BookmarkStore} from '../store/BookmarkStore';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userBookmarkStore: PersonalBookmarksStore,
    private publicBookmarkStore: BookmarkStore,
    private keycloakService: KeycloakService) {}

  ngOnInit(): void {
    if (this.keycloakService.isLoggedIn()) {
      this.keycloakService.getUserInfo().then(userInfo => {
        this.userId = userInfo.sub;
      });
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
    if (this.userId) {
      if (!bookmark.starredBy) {
        bookmark.starredBy = [];
      } else {
        bookmark.starredBy.push(this.userId);
      }
      const obs = this.userBookmarkStore.updateBookmark(bookmark);
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
      const obs = this.userBookmarkStore.updateBookmark(bookmark);
    }
  }

}
