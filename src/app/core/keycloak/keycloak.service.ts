import {Injectable} from '@angular/core';

import {environment} from 'environments/environment';
// import {KeycloakClient} from 'keycloak-js';

@Injectable()
export class KeycloakService {

  private static auth: any = {};

  public static initKeycloak(): Promise<any> {
    const keycloak = require('keycloak-js/dist/keycloak.js');

    const keycloakAuth = new keycloak(environment.keycloak);
    KeycloakService.auth.loggedIn = false;

    return new Promise((resolve, reject) => {
      keycloakAuth.init()
        .success(() => {
          // KeycloakService.auth = keycloakAuth;
          KeycloakService.auth.authz = keycloakAuth;
          KeycloakService.auth.logoutUrl = keycloakAuth.authServerUrl
            + '/realms/codingmarks/protocol/openid-connect/logout?redirect_uri='
            + document.baseURI;
          resolve();
        })
        .error((error) => {
          reject(error);
        });
    });
  }

  public login(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      KeycloakService.auth.authz.login()
        .success(() => {
          console.log('SUUUUUUUUUUCESSSSSS');
          KeycloakService.auth.loggedIn = true;
          resolve();
        })
        .error(() => {
          console.log('Errror - SUUUUUUUUUUCESSSSSS');
            reject();
        });
    });
  }

  public  isLoggedIn(): boolean {
    return KeycloakService.auth.authz && KeycloakService.auth.authz.authenticated;
  }

  getKeycloak(): any {
    return KeycloakService.auth.authz;
  }

  logout() {

    let options: any;
    options = {redirectUri: environment.HOST};
    KeycloakService.auth.authz.logout(options);

    console.log('*** LOGOUT');
    KeycloakService.auth.loggedIn = false;
    KeycloakService.auth.authz = null;

  }

  public hasRole(role: string): boolean {
    if (!KeycloakService.auth) {
      return false;
    }
    return KeycloakService.auth.authz.hasRealmRole(role);
  }

  public getToken(): string {
    return this.getKeycloak() ? this.getKeycloak().token : undefined;
  }

  public getUserInfo(): Promise<IUserInfo> {
    return new Promise<IUserInfo>((resolve, reject) => {
      KeycloakService.auth.authz.loadUserInfo()
        .success(resolve)
        .error(reject);
    });
  }

}

export interface IUserInfo {
  email?: string;
  family_name?: string;
  given_name?: string;
  name?: string; /** given_name + family_name */
  preferred_username?: string; /** Username by default email*/
  sub?: string; /** keycloak id */
}
