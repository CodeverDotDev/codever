import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Bookmark } from '../model/bookmark';

@Injectable()
export class NotifyStoresService {

  // Observable string sources
  private bookmarkDeleteSource = new Subject<Bookmark>();

  // Observable string streams
  bookmarkDeleted$ = this.bookmarkDeleteSource.asObservable();

  deleteBookmark(bookmark: Bookmark) {
    this.bookmarkDeleteSource.next(bookmark);
  }

}
