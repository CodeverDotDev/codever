import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router, RouterStateSnapshot } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

@Injectable()
export class KeycloakServiceWrapper {


  constructor(private router: Router, private keycloakService: KeycloakService) {
  }

  public login() {
    const routerStateSnapshot: RouterStateSnapshot = this.router.routerState.snapshot;
    const options: Keycloak.KeycloakLoginOptions = {};
    options.redirectUri = environment.APP_HOME_URL  + routerStateSnapshot.url;
    this.keycloakService.login(options);
  }

}
