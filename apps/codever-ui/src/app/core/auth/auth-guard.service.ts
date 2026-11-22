import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import Keycloak from 'keycloak-js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly keycloak: Keycloak,
    private readonly router: Router
  ) {}

  public async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> {
    // Force the user to log in if currently unauthenticated.
    if (!this.keycloak.authenticated) {
      await this.keycloak.login({
        redirectUri: window.location.origin + state.url,
      });
      return false;
    }

    // Get the roles required from the route.
    const requiredRoles = route.data.roles;

    // Allow the user to to proceed if no additional roles are required to access the route.
    if (!(requiredRoles instanceof Array) || requiredRoles.length === 0) {
      return true;
    }

    // Allow the user to proceed if all the required roles are present,
    // otherwise send them to the home page (a direct load would stay blank).
    const hasRequiredRoles = requiredRoles.every(
      (role) =>
        this.keycloak.hasRealmRole(role) ||
        this.keycloak.hasResourceRole(role)
    );
    return hasRequiredRoles ? true : this.router.parseUrl('/');
  }
}
