import { Component, OnInit } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { UserInfoStore } from '../../core/user/user-info.store';
import { Observable } from 'rxjs';
import { UserData } from '../../core/model/user-data';
import { UserDataStore } from '../../core/user/userdata.store';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss'],
})
export class UserDashboardComponent implements OnInit {
  private userId: string;
  selectedTabIndex: number;
  userData$: Observable<UserData>;

  constructor(
    private keycloakService: KeycloakService,
    private userInfoStore: UserInfoStore,
    private userDataStore: UserDataStore,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.keycloakService.isLoggedIn().then((isLoggedIn) => {
      if (isLoggedIn) {
        this.userInfoStore.getUserInfoOidc$().subscribe((userInfo) => {
          this.userId = userInfo.sub;
          this.userData$ = this.userDataStore.getUserData$();
          const tabQueryParam = this.route.snapshot.queryParamMap.get('tab');
          if (tabQueryParam === 'tags') {
            this.selectedTabIndex = 2;
          }
        });
      }
    });
  }
}
