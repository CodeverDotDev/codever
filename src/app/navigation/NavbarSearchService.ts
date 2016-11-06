import { Injectable } from '@angular/core';
import { Subject }    from 'rxjs/Subject';
import {Bookmark} from "../bookmark/bookmark";
import {Observable} from "rxjs";

@Injectable()
export class NavbarSearchService {

  // Observable string sources
  private foundBookmarksSource = new Subject<Observable<Bookmark[]>>();

  // Observable string streams
  foundBookmarks$ = this.foundBookmarksSource.asObservable();

  // Service message commands
  announceFoundResults(bookmarks: Observable<Bookmark[]>) {
    this.foundBookmarksSource.next(bookmarks);
  }

}
