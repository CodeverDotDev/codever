import { BehaviorSubject, Observable } from 'rxjs';

import { Injectable } from '@angular/core';

import { KeycloakService } from 'keycloak-angular';
import { UserData } from '../model/user-data';
import { UserDataService } from '../user-data.service';
import { Bookmark } from '../model/bookmark';
import { UserInfoStore } from './user-info.store';
import { NotifyStoresService } from './notify-stores.service';
import { UserDataStore } from './userdata.store';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserDataFavoritesStore {

  private _favorites: BehaviorSubject<Bookmark[]> = new BehaviorSubject(null);
  private favoriteBookmarksHaveBeenLoaded = false;

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
      this.publishedFavoritesAfterDeletion(bookmark);
    });
  }

  getFavoriteBookmarks$(page: number): Observable<Bookmark[]> {
    if (this.loadedPage !== page || !this.favoriteBookmarksHaveBeenLoaded) {
      this.userService.getFavoriteBookmarks(this.userId, page, environment.PAGINATION_PAGE_SIZE).subscribe(data => {
        if (!this.favoriteBookmarksHaveBeenLoaded) {
          this.favoriteBookmarksHaveBeenLoaded = true;
        }
        this.loadedPage = page;
        this._favorites.next(data);
      });
    }
    return this._favorites.asObservable();
  }

  addToFavoriteBookmarks(bookmark: Bookmark) {
    this.userData.favorites.unshift(bookmark._id);
    this.userDataStore.updateUserData$(this.userData).subscribe(() => {
      if (this.favoriteBookmarksHaveBeenLoaded) {
        const favoritesBookmarks: Bookmark[] = this._favorites.getValue();
        favoritesBookmarks.unshift(bookmark);

        this._favorites.next(favoritesBookmarks); // insert at the top (index 0)
      }
    });
  }

  removeFromFavoriteBookmarks(bookmark: Bookmark) {
    this.userData.favorites = this.userData.favorites.filter(x => x !== bookmark._id);
    this.userDataStore.updateUserData$(this.userData).subscribe(() => {
      this.publishedFavoritesAfterDeletion(bookmark);
    });
  }

  private publishedFavoritesAfterDeletion(bookmark: Bookmark) {
    if (this.favoriteBookmarksHaveBeenLoaded) {
      const favoritesBookmarks: Bookmark[] = this._favorites.getValue();
      const index = favoritesBookmarks.findIndex((favoriteBookmark) => bookmark._id === favoriteBookmark._id);
      if (index !== -1) {
        favoritesBookmarks.splice(index, 1);
        this._favorites.next(favoritesBookmarks);
      }
    }
  }

}

