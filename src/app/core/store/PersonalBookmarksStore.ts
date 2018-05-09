
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {List} from 'immutable';
import {Bookmark} from '../model/bookmark';
import {Logger} from '../logger.service';
import {ErrorService} from '../error/error.service';
import {Response} from '@angular/http';
import {PersonalBookmarksService} from '../personal-bookmarks.service';
import {BookmarkStore} from '../../public/bookmark/store/BookmarkStore';
import {Router} from '@angular/router';
import 'rxjs/add/operator/shareReplay';
import {KeycloakService} from 'keycloak-angular';

@Injectable()
export class PersonalBookmarksStore {

  private _bookmarks: BehaviorSubject<List<Bookmark>> = new BehaviorSubject(List([]));

  private userId: String;

  constructor(private userBookmarkService: PersonalBookmarksService,
                private logger: Logger,
                private router: Router,
                private errorService: ErrorService,
                private keycloakService: KeycloakService,
                private bookmarkStore: BookmarkStore
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

          this._bookmarks.next(List(bookmarks));
        },
        err => console.error('Error retrieving bookmarks', err)
      );
  }

  // Function to compare two objects by comparing their `unwrappedName` property.
  compareFn(a: Bookmark, b: Bookmark): number {
    if (a.publishedOn < b.publishedOn) {
      return -1;
    } else if (a.publishedOn > b.publishedOn) {
      return 1;
    } else {
      return 0;
    }
  };

  getBookmarks(): Observable<List<Bookmark>> {
      return this._bookmarks.asObservable();
  }

  addBookmark(userId: string, newBookmark: Bookmark): Observable<any> {

    const obs = this.userBookmarkService.saveBookmark(userId, newBookmark);

    obs.subscribe(
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
      (error: Response) => {
        this.errorService.handleError(error.json());
        return Observable.throw(error.json());
      }
    );

    return obs;
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

