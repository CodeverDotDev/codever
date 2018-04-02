import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {KeycloakOptions, KeycloakService} from 'keycloak-angular';
import {environment} from "../../../environments/environment";

@Component({
  selector: 'my-navigation',
  templateUrl: './navigation.component.html',
})
export class NavigationComponent  implements OnInit {

  isLoggedIn: boolean;

  async ngOnInit(): Promise<void> {
    this.isLoggedIn = await this.keycloakService.isLoggedIn();
  }

  constructor(private keycloakService: KeycloakService,  private router: Router) {}

  logout() {
    this.keycloakService.logout(environment.APP_HOME_URL);
  }

  login() {
    let options: Keycloak.KeycloakLoginOptions = {};
    options.redirectUri = environment.APP_HOME_URL  + '/personal';
    this.keycloakService.login(options).then(() => this.isLoggedIn = true);
  }
}
