import { BehaviorSubject, Observable } from 'rxjs';

import { Injectable } from '@angular/core';
import { List } from 'immutable';
import { Bookmark } from '../model/bookmark';
import { Logger } from '../logger.service';
import { ErrorService } from '../error/error.service';
import { PersonalBookmarkService } from '../personal-bookmark.service';
import { Router } from '@angular/router';

import { KeycloakService } from 'keycloak-angular';
import { PublicBookmarksStore } from '../../public/bookmarks/store/public-bookmarks-store.service';
import { UserDataStore } from '../user/userdata.store';

@Injectable()
export class PersonalBookmarksStore {

  private _personalBookmarks: BehaviorSubject<List<Bookmark>> = new BehaviorSubject(null);

  private userId: string;

  private personalTags: Set<string>;

  constructor(private personalBookmarkService: PersonalBookmarkService,
              private userDataStore: UserDataStore,
              private logger: Logger,
              private router: Router,
              private errorService: ErrorService,
              private keycloakService: KeycloakService,
              private publicBookmarksStore: PublicBookmarksStore
  ) {
    keycloakService.loadUserProfile().then(keycloakProfile => {
      this.userId = keycloakProfile.id;
      this.loadInitialData();
    });
  }

  private loadInitialData() {
    this.personalBookmarkService.getAllPersonalBookmarks(this.userId)
      .subscribe(
        data => {
          let bookmarks: Bookmark[] = <Bookmark[]>data;
          bookmarks = bookmarks.sort((a, b) => {
            const result: number = a.lastAccessedAt == null ? (b.lastAccessedAt == null ? 0 : 1)
              : b.lastAccessedAt == null ? -1 : a.lastAccessedAt < b.lastAccessedAt ? 1 : a.lastAccessedAt > b.lastAccessedAt ? -1 : 0;
            return result;
          });

          this.personalTags = new Set();
          bookmarks.forEach(bookmark => {
            // allTags.merge(allTags, OrderedSet.fromKeys(bookmark.tags));
            bookmark.tags.forEach(tag => {
              this.personalTags = this.personalTags.add(tag.trim().toLowerCase());
            });
          });
          this._personalBookmarks.next(List(bookmarks));
        },
        err => console.error('Error retrieving bookmarks', err)
      );
  }

  getPersonalBookmarks(): Observable<List<Bookmark>> {
    return this._personalBookmarks.asObservable();
  }

  getPersonalAutomcompleteTags(): Observable<string[]> {
    return this.personalBookmarkService.getTagsOfUser(this.userId);
  }

}

