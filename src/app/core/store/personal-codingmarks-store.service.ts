import {BehaviorSubject, Observable, throwError as observableThrowError} from 'rxjs';

import {Injectable} from '@angular/core';
import {List} from 'immutable';
import {Codingmark} from '../model/codingmark';
import {Logger} from '../logger.service';
import {ErrorService} from '../error/error.service';
import {PersonalCodingmarkService} from '../personal-codingmark.service';
import {Router} from '@angular/router';

import {KeycloakService} from 'keycloak-angular';
import {PublicCodingmarksStore} from '../../public/codingmark/store/public-codingmarks-store.service';
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
    keycloakService.loadUserProfile().then(keycloakProfile => {
      this.userId = keycloakProfile.id;
      this.loadInitialData();
    });
  }

  private loadInitialData() {
    this.personalCodingmarkService.getAllPersonalCodingmarks(this.userId)
      .subscribe(
        data => {
          let codingmarks: Codingmark[] = <Codingmark[]>data;
          codingmarks = codingmarks.sort((a, b) => {
            const result: number = a.lastAccessedAt == null ? (b.lastAccessedAt == null ? 0 : 1)
              : b.lastAccessedAt == null ? -1 : a.lastAccessedAt < b.lastAccessedAt ? 1 : a.lastAccessedAt > b.lastAccessedAt ? -1 : 0;
            return result;
          });

          this.personalTags = new Set();
          codingmarks.forEach(codingmark => {
            // allTags.merge(allTags, OrderedSet.fromKeys(codingmark.tags));
            codingmark.tags.forEach(tag => {
              this.personalTags = this.personalTags.add(tag.trim().toLowerCase());
            });
          });
          this._personalCodingmarks.next(List(codingmarks));
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

  addCodingmark(userId: string, codingmark: Codingmark): void {

    const obs = this.personalCodingmarkService.createCodingmark(userId, codingmark)
      .subscribe(
        res => {
          const headers = res.headers;
          // get the codingmark id, which lies in the "location" response header
          const lastSlashIndex = headers.get('location').lastIndexOf('/');
          const newBookmarkId = headers.get('location').substring(lastSlashIndex + 1);
          codingmark._id = newBookmarkId;
          // this._bookmarks.next(this._bookmarks.getValue().push(newBookmark));
          this._personalCodingmarks.next(this._personalCodingmarks.getValue().unshift(codingmark)); // insert at the top (index 0)

          if (codingmark.shared) {
            this.publicCodingmarksStore.addCodingmarkToPublicStore(codingmark);
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
      res => {
        const codingmarks: List<Codingmark> = this._personalCodingmarks.getValue();
        const index = codingmarks.findIndex((codingmark) => codingmark._id === deleted._id);
        const listWithoutElement = codingmarks.delete(index);
        this._personalCodingmarks.next(listWithoutElement);

        if (deleted.shared) {
          this.publicCodingmarksStore.removeCodingmarkFromPublicStore(deleted);
        }
      }
    );

    return obs;
  }

  updateCodingmark(updated: Codingmark): Observable<any> {
    const obs: Observable<any> = this.personalCodingmarkService.updateCodingmark(updated);

    obs.subscribe(
      res => {
        const codingmarks = this._personalCodingmarks.getValue();
        const index = codingmarks.findIndex((codingmark: Codingmark) => codingmark._id === updated._id);
        this._personalCodingmarks.next(codingmarks.delete(index).unshift(updated)); // move the updated codingmark to the top of the list, to immediately see the results

        if (updated.shared) {
          this.publicCodingmarksStore.updateCodingmarkInPublicStore(updated);
        }
      }
    );

    return obs;
  }

  getCodingmarkById(id: string): Codingmark {
    const codingmarks = this._personalCodingmarks.getValue();
    const index = codingmarks.findIndex((codingmark: Codingmark) => codingmark._id === id);

    return codingmarks.get(index);
  }

  getCodingmarkByLocation(location: string): Codingmark {
    const codingmarks = this._personalCodingmarks.getValue();
    const index = codingmarks.findIndex((codingmark: Codingmark) => codingmark.location === location);
    if (index >= 0) {
      return codingmarks.get(index);
    } else {
      return null;
    }
  }

}

