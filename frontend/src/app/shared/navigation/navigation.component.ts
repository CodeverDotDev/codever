import { Component, OnInit } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { environment } from '../../../environments/environment';
import { KeycloakServiceWrapper } from '../../core/keycloak-service-wrapper.service';
import { UserInfoOidc } from '../../core/model/user-info.oidc';
import { UserInfoStore } from '../../core/user/user-info.store';
import { Observable } from 'rxjs';
import { AppService } from '../../app.service';
import { UserData } from '../../core/model/user-data';
import { UserDataStore } from '../../core/user/userdata.store';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {

  isLoggedIn: boolean;
  userInfoOidc$: Observable<UserInfoOidc>;
  environment = environment;
  userData$: Observable<UserData>;

  constructor(private appService: AppService,
              private keycloakService: KeycloakService,
              private userInfoStore: UserInfoStore,
              private userDataStore: UserDataStore,
              private keycloakServiceWrapper: KeycloakServiceWrapper) {
  }

  ngOnInit() {
    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.userInfoOidc$ = this.userInfoStore.getUserInfo$();
        this.isLoggedIn = true;
        this.userData$ = this.userDataStore.getUserData$();
      } else {
        this.isLoggedIn = false;
      }
    });
  }

  async doLogout() {
    await this.keycloakService.logout(environment.APP_HOME_URL);
  }

  login() {
    this.keycloakServiceWrapper.login();
  }

  onLogoClick() {
    this.appService.clickLogo(true);
  }

}
