import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, CanLoad, Route, RouterStateSnapshot} from '@angular/router';
import {KeycloakService} from './keycloak/keycloak.service';
import {Observable} from 'rxjs/Observable';

@Injectable()
export class AuthGuard implements CanActivate, CanLoad {

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> | Promise<boolean> {
    console.log('AuthGuard#canActivate called');

    if (this.keycloakService.isLoggedIn()) {
      return true;
    } else {
      this.keycloakService.login();
    }

    return true;
  }


  canLoad(route: Route): Observable<boolean> | Promise<boolean> | boolean {
    return true;
  }

  constructor(private keycloakService: KeycloakService) {}

/*  canActivate() {
    console.log('AuthGuard#canActivate called');

    if (this.keycloakService.isLoggedIn()) {
      return true;
    } else {
      this.keycloakService.login();
    }

    return true;
  }*/
}
