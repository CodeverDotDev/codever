import { Injectable } from "@angular/core";
import {AsyncSubject, Observable} from "rxjs";

@Injectable()
export class KeycloakService {

  private static keycloak: any;

  public static initKeycloak(keycloakPath: string): Observable<any> {
    let subject = new AsyncSubject();
    const keycloak = require("keycloak-js/dist/keycloak.js");
    let onload: any;

    onload = {onLoad: `login-required`};

    const keycloakAuth = new keycloak(keycloakPath);
    keycloakAuth.init(onload).success(
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

  getKeycloak(): any {
    return KeycloakService.keycloak;
  }

  logout() {
    /**
     * setTimeout is required here otherwise logout will NOT work.
     */
    setTimeout(() => {
      KeycloakService.keycloak.logout();
    });
  }

  public hasRole(role: string): boolean {
    if (!KeycloakService.keycloak) {
      return false;
    }
    return KeycloakService.keycloak.hasRealmRole(role);
  }


}
