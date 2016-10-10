import {Injectable} from '@angular/core';
import {Bookmark} from './bookmark';

import { BOOKMARKS } from './mock-bookmarks';

@Injectable()
export class BookmarkService {

  getBookmarks(): Promise<Bookmark[]> {
    return Promise.resolve(BOOKMARKS);
  }

  getBookmark(id: string): Promise<Bookmark> {
    return this.getBookmarks()
      .then(bookmarks => bookmarks.find(bookmark => bookmark.id === id));
  }

}
