
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {List} from 'immutable';
import {Bookmark} from '../model/bookmark';
import {Logger} from '../logger.service';
import {ErrorService} from '../error/error.service';
import {Response} from '@angular/http';
import {PersonalBookmarksService} from '../personal-bookmarks.service';
import {KeycloakService} from '../keycloak/keycloak.service';
import {BookmarkStore} from '../../public/bookmark/store/BookmarkStore';
import {Router} from '@angular/router';

@Injectable()
export class PersonalBookmarksStore {

    private _bookmarks: BehaviorSubject<List<Bookmark>> = new BehaviorSubject(List([]));

    private userId: String;

    constructor(private userBookmarkService: PersonalBookmarksService,
                private router: Router,
                private logger: Logger,
                private errorService: ErrorService,
                private keycloakService: KeycloakService,
                private bookmarkStore: BookmarkStore
    ) {
        const keycloak = keycloakService.getKeycloak();
        if (keycloak) {
          this.userId = keycloak.subject;
        }
        this.loadInitialData();
    }

  private loadInitialData() {
    this.userBookmarkService.getAllBookmarks(this.userId)
      .subscribe(
        res => {
          const bookmarks = (<Object[]>res.json())
            .map((bookmark: any) =>
              new Bookmark(
                  bookmark.name,
                  bookmark.location,
                  bookmark.language,
                  bookmark.category,
                  bookmark.tags,
                  bookmark.publishedOn,
                  bookmark.githubURL,
                  bookmark.description,
                  bookmark.descriptionHtml,
                  bookmark._id,
                  '',
                  bookmark.userId,
                  bookmark.shared,
                  bookmark.createdAt,
                  bookmark.updatedAt,
                  bookmark.starredBy
              )
            ).sort((a, b) => {
              if (a.updatedAt < b.updatedAt) {
                return 1;
              } else if (a.updatedAt > b.updatedAt) {
                return -1;
              } else {
                return 0;
              }
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
        this._bookmarks.next(this._bookmarks.getValue().unshift(newBookmark));

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
        this.router.navigate(['/personal'], { fragment: 'navbar' });
      }
      ,
      (error: Response) => {
        this.errorService.handleError(error.json());
        return Observable.throw(error.json());
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

