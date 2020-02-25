import { BehaviorSubject, Observable } from 'rxjs';

import { Injectable } from '@angular/core';
import { UserData } from '../model/user-data';
import { UserDataService } from '../user-data.service';
import { Bookmark } from '../model/bookmark';
import { UserInfoStore } from './user-info.store';
import { UserDataStore } from './userdata.store';
import { KeycloakService } from 'keycloak-angular';
import { NotifyStoresService } from './notify-stores.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserDataHistoryStore {

  private _history: BehaviorSubject<Bookmark[]> = new BehaviorSubject(null);
  private historyHasBeenLoaded = false;

  private userId: string;
  private userData: UserData;

  loadedPage: number;

  constructor(private userService: UserDataService,
              private userDataStore: UserDataStore,
              private keycloakService: KeycloakService,
              private userInfoStore: UserInfoStore,
              private notifyStoresService: NotifyStoresService
  ) {
    this.loadedPage = 1;
    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.userInfoStore.getUserInfo$().subscribe(userInfo => {
          this.userId = userInfo.sub;
          this.userDataStore.getUserData$().subscribe(userData => {
            this.userData = userData;
          });
        });
      }
    });
    this.notifyStoresService.bookmarkDeleted$.subscribe((bookmark) => {
      this.publishHistoryAfterDeletion(bookmark);
    });
  }


  getHistory$(page: number): Observable<Bookmark[]> {
    if (this.loadedPage !== page || !this.historyHasBeenLoaded) {
      if (!this.historyHasBeenLoaded) {
        this.historyHasBeenLoaded = true;
      }
      this.userService.getLastVisitedBookmarks(this.userId, page, environment.PAGINATION_PAGE_SIZE).subscribe(data => {
        this.historyHasBeenLoaded = true;
        this.loadedPage = page;
        this._history.next(data);
      });

    }

    return this._history.asObservable();
  }

  addToHistoryAndReadLater$(bookmark: Bookmark, readLater: boolean): Observable<UserData> {
    // history
    this.removeFromUserDataHistoryIfPresent(bookmark);
    this.userData.history.unshift(bookmark._id);

    if (readLater) {
      this.userData.readLater.push(bookmark._id);
    }

    return this.userDataStore.updateUserData$(this.userData);
  }


  public publishHistoryAfterCreation(bookmark: Bookmark) {
    if (this.historyHasBeenLoaded) {
      let lastVisitedBookmarks: Bookmark[] = this._history.getValue();
      lastVisitedBookmarks = lastVisitedBookmarks.filter(item => item._id !== bookmark._id);
      lastVisitedBookmarks.unshift(bookmark);

      this._history.next(lastVisitedBookmarks);
    }
  }

  private removeFromUserDataHistoryIfPresent(bookmark: Bookmark) {
    const index = this.userData.history.indexOf(bookmark._id);
    if (index !== -1) {
      this.userData.history.splice(index, 1);
    }
  }

  public publishHistoryAfterDeletion(bookmark: Bookmark) {
    if (this.historyHasBeenLoaded) {
      const lastVisitedBookmarks: Bookmark[] = this._history.getValue();
      const indexHistory = lastVisitedBookmarks.findIndex((lastVisitedBookmark) => bookmark._id === lastVisitedBookmark._id);
      if (indexHistory !== -1) {
        lastVisitedBookmarks.splice(indexHistory, 1);
        this._history.next(lastVisitedBookmarks);
      }
    }
  }

}

