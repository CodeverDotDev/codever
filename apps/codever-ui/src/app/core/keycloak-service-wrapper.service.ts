import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Router, RouterStateSnapshot } from '@angular/router';
import Keycloak, { KeycloakLoginOptions } from 'keycloak-js';
import { SharedLoginReturn } from './sharing/shared-login-return.service';

export const SHARED_LOGIN_RETURN_PATH = '/shared/continue';

export interface LoginRequestOptions {
  /** Open the copy form when returning to a shared page after the login. */
  copyAfterLogin?: boolean;
}

@Injectable()
export class KeycloakServiceWrapper {
  constructor(
    private router: Router,
    private keycloak: Keycloak,
    private sharedLoginReturn: SharedLoginReturn
  ) {}

  public login(request: LoginRequestOptions = {}) {
    const routerStateSnapshot: RouterStateSnapshot =
      this.router.routerState.snapshot;
    const currentUrl = routerStateSnapshot.url;
    const options: KeycloakLoginOptions = {};

    if (this.sharedLoginReturn.isSharedPage(currentUrl)) {
      // The shared page URL contains the sharing token: keep it in the tab
      // and send Keycloak a token-free return address. If the tab cannot
      // store it, return to the home page rather than send the token.
      const remembered = this.sharedLoginReturn.remember(
        currentUrl,
        !!request.copyAfterLogin
      );
      options.redirectUri = remembered
        ? environment.APP_HOME_URL + SHARED_LOGIN_RETURN_PATH
        : environment.APP_HOME_URL;
    } else {
      options.redirectUri = environment.APP_HOME_URL + currentUrl;
    }
    this.keycloak.login(options);
  }
}
