import { Component, OnInit } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { UserInfoStore } from '../../core/user/user-info.store';
import { Observable } from 'rxjs';
import { UserData } from '../../core/model/user-data';
import { UserDataStore } from '../../core/user/userdata.store';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-dashboard',
    templateUrl: './user-dashboard.component.html',
    styleUrls: ['./user-dashboard.component.scss'],
    standalone: false
})
export class UserDashboardComponent implements OnInit {
  userId: string;
  selectedTabIndex: number;
  userData$: Observable<UserData>;

  // Maps tab index → query param name
  private readonly tabNames = ['bookmarks', 'notes', 'tags', 'searches', 'following', 'followers'];

  constructor(
    private keycloakService: KeycloakService,
    private userInfoStore: UserInfoStore,
    private userDataStore: UserDataStore,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const isLoggedIn = this.keycloakService.isLoggedIn();
    if (isLoggedIn) {
      this.userInfoStore.getUserInfoOidc$().subscribe((userInfo) => {
        this.userId = userInfo.sub;
        this.userData$ = this.userDataStore.getUserData$();
        this.initSelectedTab();
      });
    }
  }

  tabChanged(index: number) {
    if (this.selectedTabIndex === index) {
      return;
    }
    this.selectedTabIndex = index;
    // Sync tab name to URL and reset page to 1
    const tabName = this.tabNames[index] || 'bookmarks';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabName, page: null },
      queryParamsHandling: 'merge',
    });
  }

  private initSelectedTab() {
    const tabQueryParam = this.route.snapshot.queryParamMap.get('tab');
    // Tab order: 0=Bookmarks, 1=Notes, 2=Tags, 3=Searches, 4=Following, 5=Followers
    switch (tabQueryParam) {
      case 'bookmarks':
        this.selectedTabIndex = 0;
        break;
      case 'notes':
      case 'snippets': // legacy param – redirect to notes tab
        this.selectedTabIndex = 1;
        break;
      case 'tags':
        this.selectedTabIndex = 2;
        break;
      case 'searches':
        this.selectedTabIndex = 3;
        break;
      case 'following':
        this.selectedTabIndex = 4;
        break;
      case 'followers':
        this.selectedTabIndex = 5;
        break;
      default:
        this.selectedTabIndex = 0;
        break;
    }
  }
}
