import { Component } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { KeycloakServiceWrapper } from '../../../core/keycloak-service-wrapper.service';
import { RouterLink } from '@angular/router';
import { ExtensionsComponent } from '../../../shared/extensions/extensions.component';

@Component({
  selector: 'app-howto-get-started',
  templateUrl: './howto-get-started.component.html',
  styleUrls: ['./howto-get-started.component.scss'],
  imports: [RouterLink, ExtensionsComponent],
})
export class HowtoGetStartedComponent {
  environment = environment;

  constructor(private keycloakServiceWrapper: KeycloakServiceWrapper) {}

  login() {
    this.keycloakServiceWrapper.login();
  }
}
