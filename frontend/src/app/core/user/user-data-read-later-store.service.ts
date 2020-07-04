import { BehaviorSubject, Observable } from 'rxjs';

import { Injectable } from '@angular/core';
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
export class UserDataReadLaterStore {

  private _readLater: BehaviorSubject<Bookmark[]> = new BehaviorSubject(null);
  private readLaterHaveBeenLoaded = false;

  private userData: UserData;

  loadedPage: number;

  constructor(private userService: UserDataService,
              private userDataStore: UserDataStore,
              private userInfoStore: UserInfoStore,
              private notifyStoresService: NotifyStoresService
  ) {
    this.loadedPage = 1;
    this.userDataStore.getUserData$().subscribe(userData => {
      this.userData = userData;
    });
    this.notifyStoresService.bookmarkDeleted$.subscribe((bookmark) => {
      this.publishReadLaterAfterDeletion(bookmark);
    });
  }

  getReadLater$(userId: string, page: number): Observable<Bookmark[]> {
    if (this.loadedPage !== page || !this.readLaterHaveBeenLoaded) {
      this.userService.getReadLater(userId, page, environment.PAGINATION_PAGE_SIZE).subscribe(data => {
        if (!this.readLaterHaveBeenLoaded) {
          this.readLaterHaveBeenLoaded = true;
        }
        this.loadedPage = page;
        this._readLater.next(data);
      });
    }
    return this._readLater.asObservable();
  }

  addToReadLater(bookmark: Bookmark) {
    this.userData.readLater.push(bookmark._id);
    this.userDataStore.updateUserData$(this.userData).subscribe(() => {
      this.publishReadLaterAfterCreation(bookmark);
    });
  }

  removeFromReadLater(bookmark: Bookmark) {
    this.userData.readLater = this.userData.readLater.filter(x => x !== bookmark._id);
    this.userDataStore.updateUserData$(this.userData).subscribe(() => {
      this.publishReadLaterAfterDeletion(bookmark);
    });
  }

  private publishReadLaterAfterDeletion(bookmark: Bookmark) {
    if (this.readLaterHaveBeenLoaded) {
      const readLater: Bookmark[] = this._readLater.getValue();
      const index = readLater.findIndex((item) => bookmark._id === item._id);
      if (index !== -1) {
        readLater.splice(index, 1);
        this._readLater.next(readLater);
      }
    }
  }

  public publishReadLaterAfterCreation(bookmark: Bookmark) {
    if (this.readLaterHaveBeenLoaded) {
      const readLater: Bookmark[] = this._readLater.getValue();
      readLater.push(bookmark);
      this._readLater.next(readLater); // insert at the top (index 0)
    }
  }

}

