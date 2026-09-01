import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Router, RouterStateSnapshot } from '@angular/router';
import Keycloak, { KeycloakLoginOptions } from 'keycloak-js';

@Injectable()
export class KeycloakServiceWrapper {
  constructor(
    private router: Router,
    private keycloak: Keycloak
  ) {}

  public login() {
    const routerStateSnapshot: RouterStateSnapshot =
      this.router.routerState.snapshot;
    const options: KeycloakLoginOptions = {};
    options.redirectUri = environment.APP_HOME_URL + routerStateSnapshot.url;
    this.keycloak.login(options);
  }
}
