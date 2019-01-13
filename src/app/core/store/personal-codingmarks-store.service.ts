import {BehaviorSubject, Observable, throwError as observableThrowError} from 'rxjs';

import {Injectable} from '@angular/core';
import {List} from 'immutable';
import {Codingmark} from '../model/codingmark';
import {Logger} from '../logger.service';
import {ErrorService} from '../error/error.service';
import {PersonalCodingmarkService} from '../personal-codingmark.service';
import {Router} from '@angular/router';

import {KeycloakService} from 'keycloak-angular';
import {PublicCodingmarksStore} from '../../public/bookmark/store/public-codingmarks-store.service';
import {publicTags} from '../model/all-tags.const.en';
import {HttpResponse} from '@angular/common/http';

@Injectable()
export class PersonalCodingmarksStore {

  private _personalCodingmarks: BehaviorSubject<List<Codingmark>> = new BehaviorSubject(List([]));

  private userId: String;

  private personalTags: Set<string>;
  autocompleteTags = publicTags;

  constructor(private personalCodingmarkService: PersonalCodingmarkService,
                private logger: Logger,
                private router: Router,
                private errorService: ErrorService,
                private keycloakService: KeycloakService,
                private publicCodingmarksStore: PublicCodingmarksStore
    ) {
      keycloakService.loadUserProfile().then( keycloakProfile => {
        this.userId = keycloakProfile.id;
        this.loadInitialData();
      });
    }

  private loadInitialData() {
    this.personalCodingmarkService.getAllPersonalCodingmarks(this.userId)
      .subscribe(
        data => {
          let bookmarks: Codingmark[] = <Codingmark[]>data;
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
          this._personalCodingmarks.next(List(bookmarks));
        },
        err => console.error('Error retrieving codingmarks', err)
      );
  }

  getPersonalCodingmarks(): Observable<List<Codingmark>> {
      return this._personalCodingmarks.asObservable();
  }

  getPersonalAutomcompleteTags(): string[] {
    if (this.personalTags) {
      this.personalTags.forEach(e => this.autocompleteTags.add(e));
      return Array.from(this.autocompleteTags).sort();
    } else {
      return [];
    }
  }

  addCodingmark(userId: string, newBookmark: Codingmark): void {

    const obs = this.personalCodingmarkService.createCodingmark(userId, newBookmark)
      .subscribe(
        res => {
          const headers = res.headers;
            // get the bookmark id, which lies in the "location" response header
            const lastSlashIndex = headers.get('location').lastIndexOf('/');
            const newBookmarkId = headers.get('location').substring(lastSlashIndex + 1);
            newBookmark._id = newBookmarkId;
            // this._bookmarks.next(this._bookmarks.getValue().push(newBookmark));
            this._personalCodingmarks.next(this._personalCodingmarks.getValue().unshift(newBookmark)); // insert at the top (index 0)

            if (newBookmark.shared) {
              this.publicCodingmarksStore.addBookmark(newBookmark);
            }
            this.router.navigate(['/personal']);
          },
          (error: HttpResponse<any>) => {
            this.errorService.handleError(error.body.json());
            return observableThrowError(error.body.json());
          }
        );
  }

  deleteCodingmark(deleted: Codingmark): Observable<any> {
    const obs: Observable<any> = this.personalCodingmarkService.deleteCodingmark(deleted);

    obs.subscribe(
      res =>  {
        const bookmarks: List<Codingmark> = this._personalCodingmarks.getValue();
        const index = bookmarks.findIndex((bookmark) => bookmark._id === deleted._id);
        const listWithoutElement = bookmarks.delete(index);
        this._personalCodingmarks.next(listWithoutElement);

        if (deleted.shared) {
          this.publicCodingmarksStore.removeFromPublicStore(deleted);
        }
      }
    );

    return obs;
  }

  updateCodingmark(updated: Codingmark): Observable<any> {
    const obs: Observable<any> = this.personalCodingmarkService.updateCodingmark(updated);

    obs.subscribe(
      res => {
        const bookmarks = this._personalCodingmarks.getValue();
        const index = bookmarks.findIndex((bookmark: Codingmark) => bookmark._id === updated._id);
        this._personalCodingmarks.next(bookmarks.delete(index).unshift(updated)); // move the updated bookmark to the top of the list, to immediately see the results

        if (updated.shared) {
          this.publicCodingmarksStore.updateBookmark(updated);
        }
      }
    );

    return obs;
  }

  getCodingmarkById(id: string): Codingmark {
    const bookmarks = this._personalCodingmarks.getValue();
    const index = bookmarks.findIndex((bookmark: Codingmark) => bookmark._id === id);

    return bookmarks.get(index);
  }

  getCodingmarkByLocation(location: string): Codingmark {
    const codingmarks = this._personalCodingmarks.getValue();
    const index = codingmarks.findIndex((codingmark: Codingmark) => codingmark.location === location);
    if ( index >= 0 ) {
      return codingmarks.get(index);
    } else {
      return null;
    }
  }

}

