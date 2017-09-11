import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot} from '@angular/router';
import {KeycloakService} from '../core/keycloak/keycloak.service';
import {Observable} from 'rxjs/Observable';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private keycloakService: KeycloakService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> | Promise<boolean> {
    console.log('AuthGuard#canActivate called');

    if (this.keycloakService.isLoggedIn()) {
      return true;
    } else {
      this.keycloakService.login();
    }

    return true;
  }

}
