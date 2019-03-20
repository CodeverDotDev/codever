import {BehaviorSubject, Observable, throwError as observableThrowError} from 'rxjs';

import {Injectable} from '@angular/core';
import {List} from 'immutable';
import {Bookmark} from '../model/bookmark';
import {Logger} from '../logger.service';
import {ErrorService} from '../error/error.service';
import {PersonalBookmarkService} from '../personal-bookmark.service';
import {Router} from '@angular/router';

import {KeycloakService} from 'keycloak-angular';
import {PublicBookmarksStore} from '../../public/bookmarks/store/public-bookmarks-store.service';
import {publicTags} from '../model/all-tags.const.en';
import {HttpResponse} from '@angular/common/http';

@Injectable()
export class PersonalBookmarksStore {

  private _personalCodingmarks: BehaviorSubject<List<Bookmark>> = new BehaviorSubject(List([]));

  private userId: String;

  private personalTags: Set<string>;
  autocompleteTags = publicTags;

  constructor(private personalCodingmarkService: PersonalBookmarkService,
              private logger: Logger,
              private router: Router,
              private errorService: ErrorService,
              private keycloakService: KeycloakService,
              private publicCodingmarksStore: PublicBookmarksStore
  ) {
    keycloakService.loadUserProfile().then(keycloakProfile => {
      this.userId = keycloakProfile.id;
      this.loadInitialData();
    });
  }

  private loadInitialData() {
    this.personalCodingmarkService.getAllPersonalCodingmarks(this.userId)
      .subscribe(
        data => {
          let codingmarks: Bookmark[] = <Bookmark[]>data;
          codingmarks = codingmarks.sort((a, b) => {
            const result: number = a.lastAccessedAt == null ? (b.lastAccessedAt == null ? 0 : 1)
              : b.lastAccessedAt == null ? -1 : a.lastAccessedAt < b.lastAccessedAt ? 1 : a.lastAccessedAt > b.lastAccessedAt ? -1 : 0;
            return result;
          });

          this.personalTags = new Set();
          codingmarks.forEach(bookmark => {
            // allTags.merge(allTags, OrderedSet.fromKeys(bookmark.tags));
            bookmark.tags.forEach(tag => {
              this.personalTags = this.personalTags.add(tag.trim().toLowerCase());
            });
          });
          this._personalCodingmarks.next(List(codingmarks));
        },
        err => console.error('Error retrieving codingmarks', err)
      );
  }

  getPersonalCodingmarks(): Observable<List<Bookmark>> {
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

  addCodingmark(userId: string, bookmark: Bookmark): void {

    const obs = this.personalCodingmarkService.createCodingmark(userId, bookmark)
      .subscribe(
        res => {
          const headers = res.headers;
          // get the bookmark id, which lies in the "location" response header
          const lastSlashIndex = headers.get('location').lastIndexOf('/');
          const newBookmarkId = headers.get('location').substring(lastSlashIndex + 1);
          bookmark._id = newBookmarkId;
          // this._bookmarks.next(this._bookmarks.getValue().push(newBookmark));
          this._personalCodingmarks.next(this._personalCodingmarks.getValue().unshift(bookmark)); // insert at the top (index 0)

          if (bookmark.shared) {
            this.publicCodingmarksStore.addCodingmarkToPublicStore(bookmark);
          }
          this.router.navigate(['/personal']);
        },
        (error: HttpResponse<any>) => {
          this.errorService.handleError(error.body.json());
          return observableThrowError(error.body.json());
        }
      );
  }

  deleteCodingmark(deleted: Bookmark): Observable<any> {
    const obs: Observable<any> = this.personalCodingmarkService.deleteCodingmark(deleted);

    obs.subscribe(
      res => {
        const codingmarks: List<Bookmark> = this._personalCodingmarks.getValue();
        const index = codingmarks.findIndex((bookmark) => bookmark._id === deleted._id);
        const listWithoutElement = codingmarks.delete(index);
        this._personalCodingmarks.next(listWithoutElement);

        if (deleted.shared) {
          this.publicCodingmarksStore.removeCodingmarkFromPublicStore(deleted);
        }
      }
    );

    return obs;
  }

  updateCodingmark(updated: Bookmark): Observable<any> {
    const obs: Observable<any> = this.personalCodingmarkService.updateCodingmark(updated);

    obs.subscribe(
      res => {
        const codingmarks = this._personalCodingmarks.getValue();
        const index = codingmarks.findIndex((bookmark: Bookmark) => bookmark._id === updated._id);
        this._personalCodingmarks.next(codingmarks.delete(index).unshift(updated)); // move the updated bookmark to the top of the list, to immediately see the results

        if (updated.shared) {
          this.publicCodingmarksStore.updateCodingmarkInPublicStore(updated);
        }
      }
    );

    return obs;
  }

  getCodingmarkById(id: string): Bookmark {
    const codingmarks = this._personalCodingmarks.getValue();
    const index = codingmarks.findIndex((bookmark: Bookmark) => bookmark._id === id);

    return codingmarks.get(index);
  }

  getCodingmarkByLocation(location: string): Bookmark {
    const codingmarks = this._personalCodingmarks.getValue();
    const index = codingmarks.findIndex((bookmark: Bookmark) => bookmark.location === location);
    if (index >= 0) {
      return codingmarks.get(index);
    } else {
      return null;
    }
  }

}

