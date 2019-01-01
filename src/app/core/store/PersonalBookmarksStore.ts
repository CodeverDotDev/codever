
import {throwError as observableThrowError, Observable, BehaviorSubject} from 'rxjs';

import {Injectable} from '@angular/core';
import {List} from 'immutable';
import {Bookmark} from '../model/bookmark';
import {Logger} from '../logger.service';
import {ErrorService} from '../error/error.service';
import {Response} from '@angular/http';
import {PersonalBookmarksService} from '../personal-bookmarks.service';
import {Router} from '@angular/router';

import {KeycloakService} from 'keycloak-angular';
import {PublicBookmarksStore} from '../../public/bookmark/store/public-bookmarks.store';
import {publicTags} from '../model/all-tags.const.en';
import {HttpResponse} from '@angular/common/http';

@Injectable()
export class PersonalBookmarksStore {

  private _bookmarks: BehaviorSubject<List<Bookmark>> = new BehaviorSubject(List([]));

  private userId: String;

  private personalTags: Set<string>;
  autocompleteTags = publicTags;

  constructor(private userBookmarkService: PersonalBookmarksService,
                private logger: Logger,
                private router: Router,
                private errorService: ErrorService,
                private keycloakService: KeycloakService,
                private bookmarkStore: PublicBookmarksStore
    ) {
      keycloakService.loadUserProfile().then( keycloakProfile => {
        this.userId = keycloakProfile.id;
        this.loadInitialData();
      });
    }

  private loadInitialData() {
    this.userBookmarkService.getAllBookmarks(this.userId)
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
          this._bookmarks.next(List(bookmarks));
        },
        err => console.error('Error retrieving codingmarks', err)
      );
  }

  getBookmarks(): Observable<List<Bookmark>> {
      return this._bookmarks.asObservable();
  }

  getPersonalAutomcompleteTags(): string[] {
    this.personalTags.forEach(e => this.autocompleteTags.add(e));

    return Array.from(this.autocompleteTags).sort();
  }

  addBookmark(userId: string, newBookmark: Bookmark): void {

    const obs = this.userBookmarkService.saveBookmark(userId, newBookmark)
      .subscribe(
        res => {
          const headers = res.headers;
            // get the bookmark id, which lies in the "location" response header
            const lastSlashIndex = headers.get('location').lastIndexOf('/');
            const newBookmarkId = headers.get('location').substring(lastSlashIndex + 1);
            newBookmark._id = newBookmarkId;
            // this._bookmarks.next(this._bookmarks.getValue().push(newBookmark));
            this._bookmarks.next(this._bookmarks.getValue().unshift(newBookmark)); // insert at the top (index 0)

            if (newBookmark.shared) {
              this.bookmarkStore.addBookmark(newBookmark);
            }
            this.router.navigate(['/personal']);
          },
          (error: HttpResponse<any>) => {
            this.errorService.handleError(error.body.json());
            return observableThrowError(error.body.json());
          }
        );
  }

  deleteBookmark(deleted: Bookmark): Observable<any> {
    const obs: Observable<any> = this.userBookmarkService.delete(deleted);

    obs.subscribe(
      res =>  {
        const bookmarks: List<Bookmark> = this._bookmarks.getValue();
        const index = bookmarks.findIndex((bookmark) => bookmark._id === deleted._id);
        const listWithoutElement = bookmarks.delete(index);
        this._bookmarks.next(listWithoutElement);

        if (deleted.shared) {
          this.bookmarkStore.removeFromPublicStore(deleted);
        }
      }
    );

    return obs;
  }

  updateBookmark(updated: Bookmark): Observable<any> {
    const obs: Observable<any> = this.userBookmarkService.updateBookmark(updated);

    obs.subscribe(
      res => {
        const bookmarks = this._bookmarks.getValue();
        const index = bookmarks.findIndex((bookmark: Bookmark) => bookmark._id === updated._id);
        this._bookmarks.next(bookmarks.delete(index).unshift(updated)); // move the updated bookmark to the top of the list, to immediately see the results

        if (updated.shared) {
          this.bookmarkStore.updateBookmark(updated);
        }
      }
    );

    return obs;
  }

  getBookmark(id: string): Bookmark {
    const bookmarks = this._bookmarks.getValue();
    const index = bookmarks.findIndex((bookmark: Bookmark) => bookmark._id === id);

    return bookmarks.get(index);
  }

  getBookmarkByLocation(location: string): Bookmark {
    const bookmarks = this._bookmarks.getValue();
    const index = bookmarks.findIndex((bookmark: Bookmark) => bookmark.location === location);
    if ( index >= 0 ) {
      return bookmarks.get(index);
    } else {
      return null;
    }
  }

}

