import { BehaviorSubject, Observable } from 'rxjs';

import { Injectable } from '@angular/core';
import { UserDataService } from '../user-data.service';
import { Bookmark } from '../model/bookmark';
import { UserInfoStore } from './user-info.store';
import { NotifyStoresService } from './notify-stores.service';
import { UserDataStore } from './userdata.store';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserDataReadLaterStore {
  private _readLater: BehaviorSubject<Bookmark[]> = new BehaviorSubject(null);
  private readLaterHaveBeenLoaded = false;
  private loadingPage: number | null = null;

  loadedPage: number;

  constructor(
    private userService: UserDataService,
    private userDataStore: UserDataStore,
    private userInfoStore: UserInfoStore,
    private notifyStoresService: NotifyStoresService
  ) {
    this.loadedPage = 1;
    this.notifyStoresService.bookmarkDeleted$.subscribe((bookmark) => {
      this.publishReadLaterAfterDeletion(bookmark);
    });
  }

  getReadLater$(userId: string, page: number): Observable<Bookmark[]> {
    if (
      this.loadingPage !== page &&
      (this.loadedPage !== page || !this.readLaterHaveBeenLoaded)
    ) {
      this.loadingPage = page;
      this.userService
        .getReadLater(userId, page, environment.PAGINATION_PAGE_SIZE)
        .subscribe((data) => {
          this.readLaterHaveBeenLoaded = true;
          this.loadedPage = page;
          this.loadingPage = null;
          this._readLater.next(data);
        }, () => {
          this.loadingPage = null;
        });
    }
    return this._readLater.asObservable();
  }

  addToReadLater(bookmark: Bookmark) {
    this.userDataStore.addToUserReadLater$(bookmark).subscribe(() => {
      this.publishReadLaterAfterCreation(bookmark);
    });
  }

  removeFromReadLater(bookmark: Bookmark) {
    this.userDataStore.removeFromUserDataReadLater$(bookmark).subscribe(() => {
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
