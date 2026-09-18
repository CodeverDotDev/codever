import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { UserData } from '../../core/model/user-data';
import { UserInfoStore } from '../../core/user/user-info.store';
import { UserDataStore } from '../../core/user/userdata.store';
import { localStorageKeys } from '../../core/model/localstorage.cache-keys';
import { LocalStorageService } from '../../core/cache/local-storage.service';
import {
  MatTabGroup,
  MatTab,
  MatTabLabel,
  MatTabContent,
} from '@angular/material/tabs';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { UserFeedComponent } from './user-feed/user-feed.component';
import { UserLocalStorageSetupComponent } from './local-storage/user-local-storage-setup.component';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.scss'],
  imports: [
    MatTabGroup,
    MatTab,
    MatTabLabel,
    MatTabContent,
    UserProfileComponent,
    UserFeedComponent,
    UserLocalStorageSetupComponent,
    AsyncPipe,
  ],
})
export class UserSettingsComponent implements OnInit {
  environment = environment;
  userData$: Observable<UserData>;

  constructor(
    private userInfoStore: UserInfoStore,
    private userDataStore: UserDataStore,
    private localStorageService: LocalStorageService
  ) {}

  ngOnInit() {
    this.userInfoStore.getUserInfoOidc$().subscribe(() => {
      this.userData$ = this.userDataStore.getUserData$();
    });
  }

  /**
   * Proactively clear userinfo cache entry when user selects entry
   */
  clearAccountCacheEntry() {
    this.localStorageService.cleanCachedKey(localStorageKeys.userInfoOidc);
  }
}
