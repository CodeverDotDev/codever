import { Injectable } from "@angular/core";
import {AsyncSubject, Observable} from "rxjs";

@Injectable()
export class KeycloakService {

  private static keycloak: any;

  public static initKeycloak(keycloakPath: string): Observable<any> {
    let subject = new AsyncSubject();
    const keycloak = require("keycloak-js/dist/keycloak.js");
    let onload: any;

    const keycloakAuth = new keycloak(keycloakPath);
    //const keycloakAuth = new keycloak('keycloak.json');
    keycloakAuth.init().success(
      () => {
        KeycloakService.keycloak = keycloakAuth;
        subject.next("success");
        subject.complete();
      }).error((error) => {
        subject.error(error);
        subject.complete();
    });
    return subject;
  }

  public login(){
    let options: any;
    options = {redirectUri: process.env.HOST + 'personal'};
    KeycloakService.keycloak.login(options);
  }

  public  isLoggedIn():boolean{
    return KeycloakService.keycloak.authenticated;
  }

  getKeycloak(): any {
    return KeycloakService.keycloak;
  }

  logout() {
    /**
     * setTimeout is required here otherwise logout will NOT work.
     */
    setTimeout(() => {
      let options: any;
      options = {redirectUri: process.env.HOST};
      KeycloakService.keycloak.logout(options);
    });
  }

  public hasRole(role: string): boolean {
    if (!KeycloakService.keycloak) {
      return false;
    }
    return KeycloakService.keycloak.hasRealmRole(role);
  }


}
