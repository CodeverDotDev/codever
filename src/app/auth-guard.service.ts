import { Injectable }     from '@angular/core';
import {CanActivate}    from '@angular/router';
import {KeycloakService} from "./keycloak/keycloak.service";

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private keycloakService:KeycloakService) {}

  canActivate() {
    console.log('AuthGuard#canActivate called');

    if(this.keycloakService.isLoggedIn()) {
      return true;
    } else {
      this.keycloakService.login();
    }
  }
}
