import {Component, Input} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {Bookmark} from '../../core/model/bookmark';
import {PersonalBookmarksStore} from '../store/PersonalBookmarksStore';
import {KeycloakService} from '../../core/keycloak/keycloak.service';

@Component({
  selector: 'my-async-personal-bookmark-list',
  templateUrl: './async-personal-bookmark-list.component.html',
  styleUrls: ['./async-personal-bookmark-list.component.scss']
})
export class AsyncUserBookmarksListComponent{

  @Input()
  bookmarks: Observable<Bookmark[]>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userBookmarkStore: PersonalBookmarksStore,
    private keycloakService: KeycloakService
  ) {}

  /**
   *
   * @param bookmark
   */
  gotoDetail(bookmark: Bookmark): void {
    const link = ['./bookmarks', bookmark._id];
    this.router.navigate(link, { relativeTo: this.route });
  }

  deleteBookmark(bookmark: Bookmark): void {
    const obs = this.userBookmarkStore.deleteBookmark(bookmark);
  }

  async starBookmark(bookmark: Bookmark) {
    if (this.keycloakService.isLoggedIn()) {
      this.keycloakService.getUserInfo().then(userInfo => {
        console.log(userInfo.sub);
        if (!bookmark.starredBy) {
          bookmark.starredBy = [];
        } else {
          bookmark.starredBy.push(userInfo.sub);
        }
        const obs = this.userBookmarkStore.updateBookmark(bookmark);
      });
    }

  }
}
