import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../../core/auth/authentication.service';
import { environment } from '../../../environments/environment';
import { KeycloakServiceWrapper } from '../../core/keycloak-service-wrapper.service';
import { UserInfoOidc } from '../../core/model/user-info.oidc';
import { UserInfoStore } from '../../core/user/user-info.store';
import { Observable } from 'rxjs';
import { AppService } from '../../app.service';
import { UserData } from '../../core/model/user-data';
import { UserDataStore } from '../../core/user/userdata.store';
import { localStorageKeys } from '../../core/model/localstorage.cache-keys';
import { LocalStorageService } from '../../core/cache/local-storage.service';

@Component({
    selector: 'app-navigation',
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.scss'],
    standalone: false
})
export class NavigationComponent implements OnInit {
  isLoggedIn: boolean;
  userInfoOidc$: Observable<UserInfoOidc>;
  environment = environment;
  userData$: Observable<UserData>;

  constructor(
    private appService: AppService,
    private keycloakService: AuthenticationService,
    private userInfoStore: UserInfoStore,
    private userDataStore: UserDataStore,
    private localStorageService: LocalStorageService,
    private keycloakServiceWrapper: KeycloakServiceWrapper
  ) {}

  ngOnInit() {
    const isLoggedIn = this.keycloakService.isLoggedIn();
    if (isLoggedIn) {
      this.userInfoOidc$ = this.userInfoStore.getUserInfoOidc$();
      this.isLoggedIn = true;
      this.userData$ = this.userDataStore.getUserData$();
    } else {
      this.isLoggedIn = false;
    }
  }

  async doLogout() {
    this.localStorageService.cleanUserRelatedData();
    // keycloak-js 24 performs an OIDC-compliant RP-initiated logout: it sends
    // post_logout_redirect_uri (from `redirectUri`) and id_token_hint automatically,
    // and clears the local tokens — so no manual logout URL is needed anymore.
    await this.keycloakService.getKeycloakInstance().logout({
      redirectUri: environment.APP_HOME_URL,
    });
  }

  login() {
    this.keycloakServiceWrapper.login();
  }

  onLogoClick() {
    this.appService.clickLogo(true);
  }

  /**
   * Proactively clear userinfo cache entry when user selects entry
   */
  clearAccountCacheEntry() {
    this.localStorageService.cleanCachedKey(localStorageKeys.userInfoOidc);
  }
}
