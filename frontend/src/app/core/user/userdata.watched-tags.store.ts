import { Injectable } from '@angular/core';
import { UserData } from '../model/user-data';
import { UserDataService } from '../user-data.service';
import { UserInfoStore } from './user-info.store';
import { NotifyStoresService } from './notify-stores.service';
import { UserDataStore } from './userdata.store';

@Injectable({
  providedIn: 'root',
})
export class UserDataWatchedTagsStore {
  private userData: UserData;

  loadedPage: number;

  constructor(
    private userService: UserDataService,
    private userDataStore: UserDataStore,
    private userInfoStore: UserInfoStore,
    private notifyStoresService: NotifyStoresService
  ) {
    this.loadedPage = 1;
    this.userDataStore.getUserData$().subscribe((userData) => {
      this.userData = userData;
    });
    this.notifyStoresService.bookmarkDeleted$.subscribe((bookmark) => {
      // TODO remove from watched tags...
    });
  }

  watchTag(tag: string) {
    this.userData.watchedTags.push(tag);
    const index = this.userData.ignoredTags.indexOf(tag);
    if (index > -1) {
      this.userData.ignoredTags.splice(index, 1);
    }
    this.userDataStore.updateUserData$(this.userData);
  }

  unwatchTag(tag: string) {
    const index = this.userData.watchedTags.indexOf(tag);
    if (index > -1) {
      this.userData.watchedTags.splice(index, 1);
      this.userDataStore.updateUserData$(this.userData);
    }
  }

  ignoreTag(tag: string) {
    this.userData.ignoredTags.push(tag);
    const index = this.userData.watchedTags.indexOf(tag);
    if (index > -1) {
      this.userData.watchedTags.splice(index, 1);
    }

    this.userDataStore.updateUserData$(this.userData);
  }

  unignoreTag(tag: string) {
    const index = this.userData.ignoredTags.indexOf(tag);
    if (index > -1) {
      this.userData.ignoredTags.splice(index, 1);
      this.userDataStore.updateUserData$(this.userData);
    }
  }
}
