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
          reject(error);
        });
    });
  }

  public login(): Promise<any> {
    let options: any;
    options = {redirectUri: environment.HOST + 'personal'};
    // KeycloakService.auth.login(options);
    return new Promise<any>((resolve, reject) => {
      KeycloakService.auth.login(options)
        .success(resolve)
        .error(reject);
    });
  }

  public  isLoggedIn(): boolean {
    return KeycloakService.auth && KeycloakService.auth.authenticated;
  }

  getKeycloak(): any {
    return KeycloakService.auth;
  }

  logout() {
    let options: any;
    options = {redirectUri: environment.HOST};
    KeycloakService.auth.logout(options);

  }

  public hasRole(role: string): boolean {
    if (!KeycloakService.auth) {
      return false;
    }
    return KeycloakService.auth.hasRealmRole(role);
  }

  public getToken(): string {
    return this.getKeycloak() ? this.getKeycloak().token : undefined;
  }

  public getUserInfo(): Promise<IUserInfo> {
    return new Promise<IUserInfo>((resolve, reject) => {
      KeycloakService.auth.loadUserInfo()
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
