import { Component } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { KeycloakServiceWrapper } from '../../../core/keycloak-service-wrapper.service';

@Component({
  selector: 'app-howto-get-started',
  templateUrl: './howto-get-started.component.html',
  styleUrls: ['./howto-get-started.component.scss'],
})
export class HowtoGetStartedComponent {
  environment = environment;

  constructor(private keycloakServiceWrapper: KeycloakServiceWrapper) {}

  login() {
    this.keycloakServiceWrapper.login();
  }
}
