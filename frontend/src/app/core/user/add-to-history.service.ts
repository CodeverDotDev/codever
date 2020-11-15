import { Injectable } from '@angular/core';
import { Bookmark } from '../model/bookmark';
import { UserDataStore } from './userdata.store';

@Injectable({
  providedIn: 'root'
})
export class AddToHistoryService {
  constructor(private userDataStore: UserDataStore) {
  }

  onClickInDescription(userIsLoggedIn: boolean, $event: any, bookmark: Bookmark) {
    if (userIsLoggedIn && this.isHtmlAnchorElement($event)) {
      $event.target.setAttribute('target', '_blank');
      this.userDataStore.updateUserDataHistory$(bookmark);
    }
  }

  onMiddleClickInDescription(userIsLoggedIn: boolean, $event: any, bookmark: Bookmark) {
    if (userIsLoggedIn && this.isHtmlAnchorElement($event)) {
      this.userDataStore.updateUserDataHistory$(bookmark);
    }
  }

  private isHtmlAnchorElement($event: any) {
    return $event.target.matches('a');
  }

  promoteInHistoryIfLoggedIn(userIsLoggedIn: boolean, bookmark: Bookmark) {
    if (userIsLoggedIn) {
      this.userDataStore.updateUserDataHistory$(bookmark);
    }
  }
}
