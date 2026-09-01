import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakLoginOptions } from 'keycloak-js';

@Component({
    selector: 'app-about',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss'],
    standalone: false
})
export class RegisterComponent {
  environment = environment;

  constructor(private keycloakService: KeycloakService) {}

  login() {
    const options: KeycloakLoginOptions = {};
    options.redirectUri = `${environment.APP_HOME_URL}`;
    this.keycloakService.login(options);
  }
}
