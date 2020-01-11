import { Component, OnInit } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { UserInfoStore } from '../../core/user/user-info.store';

@Component({
  selector: 'app-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss']
})
export class UserDashboardComponent implements OnInit {

  private userId: string;

  constructor(private keycloakService: KeycloakService,
              private userInfoStore: UserInfoStore) {
  }

  ngOnInit() {
    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.userInfoStore.getUserInfo$().subscribe(userInfo => {
          this.userId = userInfo.sub;
        });
      }
    });
  }

}
