import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../../environments/environment';
import { KeycloakServiceWrapper } from '../keycloak-service-wrapper.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
})
export class NavigationComponent implements OnInit {

  isLoggedIn: boolean;

  ngOnInit() {
    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.isLoggedIn = true;
      } else {
        this.isLoggedIn = false;
      }
    });
  }

  constructor(private keycloakService: KeycloakService, private keycloakServiceWrapper: KeycloakServiceWrapper) {
  }

  logout() {
    this.keycloakService.logout(environment.APP_HOME_URL);
  }

  login() {
    this.keycloakServiceWrapper.login();
  }
}
