import { Injectable } from '@angular/core';
import { Bookmark } from '../model/bookmark';
import { UserDataStore } from './userdata.store';

@Injectable({
  providedIn: 'root',
})
export class AddToHistoryService {
  constructor(private userDataStore: UserDataStore) {}

  onClickInDescription(
    userIsLoggedIn: boolean,
    $event: any,
    bookmark: Bookmark
  ) {
    const anchor = this.getClickedAnchor($event);
    if (userIsLoggedIn && anchor) {
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
      this.userDataStore.updateUserDataHistory$(bookmark);
    }
  }

  onMiddleClickInDescription(
    userIsLoggedIn: boolean,
    $event: any,
    bookmark: Bookmark
  ) {
    if (userIsLoggedIn && this.getClickedAnchor($event)) {
      this.userDataStore.updateUserDataHistory$(bookmark);
    }
  }

  /**
   * Resolve the anchor for a click inside a rendered description. Uses
   * `closest('a')` so clicks landing on inline children of a link (e.g. the
   * `<strong>` in a bold link `[**text**](url)`, `<em>`, `<code>`) still
   * resolve to the surrounding anchor. `matches('a')` alone missed those.
   */
  private getClickedAnchor($event: any): HTMLAnchorElement | null {
    const target = $event?.target;
    return target && typeof target.closest === 'function'
      ? (target.closest('a') as HTMLAnchorElement | null)
      : null;
  }

  promoteInHistoryIfLoggedIn(userIsLoggedIn: boolean, bookmark: Bookmark) {
    if (userIsLoggedIn) {
      this.userDataStore.updateUserDataHistory$(bookmark);
    }
  }
}
