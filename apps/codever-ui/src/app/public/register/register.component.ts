import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-about',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  environment = environment;

  constructor(private keycloakService: KeycloakService) {}

  login() {
    const options: Keycloak.KeycloakLoginOptions = {};
    options.redirectUri = `${environment.APP_HOME_URL}`;
    this.keycloakService.login(options);
  }
}
