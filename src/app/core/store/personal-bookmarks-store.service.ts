import { BehaviorSubject, Observable, throwError as observableThrowError } from 'rxjs';

import { Injectable } from '@angular/core';
import { List } from 'immutable';
import { Bookmark } from '../model/bookmark';
import { Logger } from '../logger.service';
import { ErrorService } from '../error/error.service';
import { PersonalBookmarkService } from '../personal-bookmark.service';
import { Router } from '@angular/router';

import { KeycloakService } from 'keycloak-angular';
import { PublicBookmarksStore } from '../../public/bookmarks/store/public-bookmarks-store.service';
import { HttpResponse } from '@angular/common/http';
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

  addBookmark(userId: string, bookmark: Bookmark): void {

    const obs = this.personalBookmarkService.createBookmark(userId, bookmark)
      .subscribe(
        res => {
          const headers = res.headers;
          // get the bookmark id, which lies in the "location" response header
          const lastSlashIndex = headers.get('location').lastIndexOf('/');
          const newBookmarkId = headers.get('location').substring(lastSlashIndex + 1);
          bookmark._id = newBookmarkId;
          // this._bookmarks.next(this._bookmarks.getValue().push(newBookmark));
          this._personalBookmarks.next(this._personalBookmarks.getValue().unshift(bookmark)); // insert at the top (index 0)

          if (bookmark.shared) {
            this.publicBookmarksStore.addBookmarkToPublicStore(bookmark);
          }
          this.userDataStore.addToHistory(bookmark);
          this.router.navigate(
            ['/'],
            {
              queryParams: {tab: 'history'}
            });
        },
        (error: HttpResponse<any>) => {
          this.errorService.handleError(error.body.json());
          return observableThrowError(error.body.json());
        }
      );
  }


  deleteBookmark(deleted: Bookmark): Observable<any> {
    const obs: Observable<any> = this.personalBookmarkService.deleteBookmark(deleted);

    obs.subscribe(
      res => {
        const bookmarks: List<Bookmark> = this._personalBookmarks.getValue();
        const index = bookmarks.findIndex((bookmark) => bookmark._id === deleted._id);
        const listWithoutElement = bookmarks.delete(index);
        this._personalBookmarks.next(listWithoutElement);

        if (deleted.shared) {
          this.publicBookmarksStore.removeBookmarkFromPublicStore(deleted);
        }
      }
    );

    return obs;
  }

  addToPersonalBookmarksStore(starred: Bookmark): void {
    const bookmarks: List<Bookmark> = this._personalBookmarks.getValue();
    const index = bookmarks.findIndex((bookmark) => bookmark._id === starred._id);
    if (index === -1) {
      this._personalBookmarks.next(this._personalBookmarks.getValue().unshift(starred)); // insert at the top (index 0)
    }
  }

  removeBookmarkFromPersonalBookmarksStore(unstarred: Bookmark): void {
    const bookmarks: List<Bookmark> = this._personalBookmarks.getValue();
    const index = bookmarks.findIndex((bookmark) => bookmark._id === unstarred._id && bookmark.userId !== this.userId);
    if (index !== -1) {
      const listWithoutElement = bookmarks.delete(index);
      this._personalBookmarks.next(listWithoutElement);
    }
  }

  updateBookmark(updated: Bookmark): Observable<any> {
    const obs: Observable<any> = this.personalBookmarkService.updateBookmark(updated);

    obs.subscribe(
      res => {
        const bookmarks = this._personalBookmarks.getValue();
        const index = bookmarks.findIndex((bookmark: Bookmark) => bookmark._id === updated._id);
        this._personalBookmarks.next(bookmarks.delete(index).unshift(updated)); // move the updated bookmark to the top of the list, to immediately see the results

        if (updated.shared) {
          this.publicBookmarksStore.updateBookmarkInPublicStore(updated);
        }
        this.userDataStore.addToHistory(updated);
      }
    );

    return obs;
  }

  getBookmarkById(id: string): Bookmark {
    const bookmarks = this._personalBookmarks.getValue();
    const index = bookmarks.findIndex((bookmark: Bookmark) => bookmark._id === id);

    return bookmarks.get(index);
  }

  getPersonalBookmarkByLocation(location: string): Observable<HttpResponse<Bookmark>> {
    return this.personalBookmarkService.getPersonalBookmarkByLocation(this.userId, location);
  }

}

