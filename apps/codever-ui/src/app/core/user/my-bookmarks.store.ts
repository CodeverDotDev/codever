import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Bookmark } from '../model/bookmark';
import { PersonalBookmarksService } from '../personal-bookmarks.service';

@Injectable()
export class MyBookmarksStore {
  private _lastCreated: BehaviorSubject<Bookmark[]> = new BehaviorSubject(null);
  private lastCreatedHaveBeenLoaded = false;

  private _mostUsed: BehaviorSubject<Bookmark[]> = new BehaviorSubject(null);
  private mostUsedHaveBeenLoaded = false;

  private _mostLiked: BehaviorSubject<Bookmark[]> = new BehaviorSubject(null);
  private mostLikedBeenLoaded = false;

  constructor(private personalBookmarksService: PersonalBookmarksService) {}

  getLastCreated$(userId, orderBy): Observable<Bookmark[]> {
    if (!this.lastCreatedHaveBeenLoaded) {
      this.personalBookmarksService
        .getPersonalBookmarkOrderedBy(userId, orderBy)
        .subscribe((data) => {
          this.lastCreatedHaveBeenLoaded = true;
          this._lastCreated.next(data);
        });
    }
    return this._lastCreated.asObservable();
  }

  addToLastCreatedBulk(bookmarks: Bookmark[]): void {
    for (const bookmark of bookmarks) {
      this.addToLastCreated(bookmark);
    }
  }

  addToLastCreated(bookmark: Bookmark): void {
    if (this.lastCreatedHaveBeenLoaded) {
      const lastCreated = this._lastCreated.getValue();
      lastCreated.unshift(bookmark);

      this._lastCreated.next(lastCreated.slice(0, 30));
    }
  }

  removeFromLastCreated(deleted: Bookmark): void {
    if (this.lastCreatedHaveBeenLoaded) {
      const bookmarks: Bookmark[] = this._lastCreated.getValue();
      const index = bookmarks.findIndex(
        (bookmark) => bookmark._id === deleted._id
      );
      bookmarks.splice(index, 1);
      this._lastCreated.next(bookmarks);
    }
  }

  getMostLiked$(userId, orderBy): Observable<Bookmark[]> {
    if (!this.mostLikedBeenLoaded) {
      this.personalBookmarksService
        .getPersonalBookmarkOrderedBy(userId, orderBy)
        .subscribe((data) => {
          this.mostLikedBeenLoaded = true;
          this._mostLiked.next(data);
        });
    }
    return this._mostLiked.asObservable();
  }

  removeFromMostLiked(deleted: Bookmark): void {
    if (this.mostLikedBeenLoaded) {
      const bookmarks: Bookmark[] = this._mostLiked.getValue();
      const index = bookmarks.findIndex(
        (bookmark) => bookmark._id === deleted._id
      );
      bookmarks.splice(index, 1);
      this._mostLiked.next(bookmarks);
    }
  }

  getMostUsed$(userId, orderBy): Observable<Bookmark[]> {
    if (!this.mostUsedHaveBeenLoaded) {
      this.personalBookmarksService
        .getPersonalBookmarkOrderedBy(userId, orderBy)
        .subscribe((data) => {
          this.mostUsedHaveBeenLoaded = true;
          this._mostUsed.next(data);
        });
    }
    return this._mostUsed.asObservable();
  }

  removeFromMostUsed(deleted: Bookmark): void {
    if (this.mostUsedHaveBeenLoaded) {
      const bookmarks: Bookmark[] = this._mostUsed.getValue();
      const index = bookmarks.findIndex(
        (bookmark) => bookmark._id === deleted._id
      );
      bookmarks.splice(index, 1);
      this._mostUsed.next(bookmarks);
    }
  }

  removeFromStoresAtDeletion(bookmark: Bookmark) {
    this.removeFromLastCreated(bookmark);
    this.removeFromMostLiked(bookmark);
    this.removeFromMostUsed(bookmark);
  }
}
