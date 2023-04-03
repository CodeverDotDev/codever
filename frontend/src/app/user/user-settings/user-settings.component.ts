import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { UserData } from '../../core/model/user-data';
import { UserInfoStore } from '../../core/user/user-info.store';
import { UserDataStore } from '../../core/user/userdata.store';
import { localStorageKeys } from '../../core/model/localstorage.cache-keys';
import { LocalStorageService } from '../../core/cache/local-storage.service';

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.scss'],
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
