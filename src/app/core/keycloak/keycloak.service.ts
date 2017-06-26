import {Injectable} from '@angular/core';

import {environment} from 'environments/environment';
// import {KeycloakClient} from 'keycloak-js';

@Injectable()
export class KeycloakService {

  private static auth: any = {};

  public static initKeycloak(): Promise<any> {
    const keycloak = require('keycloak-js/dist/keycloak.js');

    const keycloakAuth = new keycloak(environment.keycloak);
    return new Promise((resolve, reject) => {
      keycloakAuth.init()
        .success(() => {
          KeycloakService.auth = keycloakAuth;
          resolve();
        })
        .error((error) => {
          reject();
        });
    });
  }

  public login() {
    let options: any;
    options = {redirectUri: environment.HOST + 'personal'};
    KeycloakService.auth.login(options);
  }

  public  isLoggedIn(): boolean {
    return KeycloakService.auth.authenticated;
  }

  getKeycloak(): any {
    return KeycloakService.auth;
  }

  logout() {
    /**
     * setTimeout is required here otherwise logout will NOT work.
     */
    setTimeout(() => {
      let options: any;
      options = {redirectUri: environment.HOST};
      KeycloakService.auth.logout(options);
    });
  }

  public hasRole(role: string): boolean {
    if (!KeycloakService.auth) {
      return false;
    }
    return KeycloakService.auth.hasRealmRole(role);
  }


}
