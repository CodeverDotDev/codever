import { Component, OnInit } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../../environments/environment';
import { KeycloakServiceWrapper } from '../keycloak-service-wrapper.service';
import { UserInfoOidc } from '../model/user-info.oidc';
import { UserInfoStore } from '../user/user-info.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {

  isLoggedIn: boolean;
  userInfo$: Observable<UserInfoOidc>;
  environment = environment;

  ngOnInit() {
    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.userInfo$ = this.userInfoStore.getUserInfo$();
        this.isLoggedIn = true;
      } else {
        this.isLoggedIn = false;
      }
    });
  }

  constructor(private keycloakService: KeycloakService,
              private userInfoStore: UserInfoStore,
              private keycloakServiceWrapper: KeycloakServiceWrapper) {
  }

  async logout() {
    await this.keycloakService.logout(environment.APP_HOME_URL);
  }

  login() {
    this.keycloakServiceWrapper.login();
  }
}
