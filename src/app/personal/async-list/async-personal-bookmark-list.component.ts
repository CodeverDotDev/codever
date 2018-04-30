import {Component, Input, NgZone, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {Bookmark} from '../../core/model/bookmark';
import {PersonalBookmarksStore} from '../../core/store/PersonalBookmarksStore';
import {KeycloakService} from 'keycloak-angular';

@Component({
  selector: 'my-async-personal-bookmark-list',
  templateUrl: './async-personal-bookmark-list.component.html',
  styleUrls: ['./async-personal-bookmark-list.component.scss']
})
export class AsyncUserBookmarksListComponent implements OnInit {

  @Input()
  userId: string;

  @Input()
  bookmarks: Observable<Bookmark[]>;

  ngOnInit(): void {
    this.keycloakService.isLoggedIn().then(isLoogedIn => {
      if (isLoogedIn) {
        this.keycloakService.loadUserProfile().then( keycloakProfile => {
          this.userId = keycloakProfile.id;
        });
      }
    });
  }

  constructor(
    private route: ActivatedRoute,
    private zone: NgZone, // TODO without explicitly running the zone functionality the view does not get updated, though model and everything gets updated
    private router: Router,
    private userBookmarkStore: PersonalBookmarksStore,
    private keycloakService: KeycloakService
  ) {}



  deleteBookmark(bookmark: Bookmark): void {
    const obs = this.userBookmarkStore.deleteBookmark(bookmark);
    obs.subscribe(
      res => {
        this.zone.run(() => {
          console.log('ZONE RUN bookmark deleted');
        });
      });
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
