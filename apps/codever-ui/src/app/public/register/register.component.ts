import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthenticationService } from '../../core/auth/authentication.service';
import { KeycloakLoginOptions } from 'keycloak-js';
import { ExtensionsComponent } from '../../shared/extensions/extensions.component';

@Component({
  selector: 'app-about',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [ExtensionsComponent],
})
export class RegisterComponent {
  environment = environment;

  constructor(private keycloakService: AuthenticationService) {}

  login() {
    const options: KeycloakLoginOptions = {};
    options.redirectUri = `${environment.APP_HOME_URL}`;
    this.keycloakService.login(options);
  }
}
