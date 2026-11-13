import { Directive, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { KeycloakLoginOptions } from 'keycloak-js';
import { Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthenticationService } from '../../../core/auth/authentication.service';
import { UserData } from '../../../core/model/user-data';
import { HomeTabId } from '../../../core/home-tabs/home-tabs';
import { PaginationNotificationService } from '../../../core/pagination-notification.service';
import { UserDataStore } from '../../../core/user/userdata.store';

// Selector-less directive: the Angular compiler requires an explicit
// decorator on base classes that use Angular features (lifecycle hooks).
@Directive()
export abstract class HomeTabPageBase implements OnDestroy {
  readonly userIsLoggedIn: boolean;
  readonly userData$: Observable<UserData> | undefined;
  currentPage: number;
  userId: string;

  private pageNavigationSubscription: Subscription;

  protected constructor(
    protected readonly route: ActivatedRoute,
    protected readonly authenticationService: AuthenticationService,
    protected readonly userDataStore: UserDataStore,
    protected readonly paginationNotificationService: PaginationNotificationService,
    protected readonly tabId: HomeTabId
  ) {
    this.userIsLoggedIn = authenticationService.isLoggedIn();
    this.userData$ = this.userIsLoggedIn
      ? userDataStore.getUserData$()
      : undefined;
    this.currentPage = this.getPageFromRoute();
  }

  protected initializePage(loadPage: (page: number) => void): void {
    if (this.userIsLoggedIn) {
      this.userData$?.pipe(take(1)).subscribe((userData) => {
        this.userId = userData.userId;
        loadPage(this.currentPage);
      });
    }

    this.pageNavigationSubscription =
      this.paginationNotificationService.pageNavigationClicked$.subscribe(
        (paginationAction) => {
          if (
            paginationAction.caller === this.tabId &&
            this.userIsLoggedIn &&
            this.userId
          ) {
            this.currentPage = paginationAction.page;
            loadPage(paginationAction.page);
          }
        }
      );
  }

  login(): void {
    const options: KeycloakLoginOptions = {};
    const pageQuery =
      this.currentPage > 1 ? `?page=${this.currentPage}` : '';
    options.redirectUri = `${environment.APP_HOME_URL}/${this.tabId}${pageQuery}`;
    this.authenticationService.login(options);
  }

  private getPageFromRoute(): number {
    const page = Number.parseInt(
      this.route.snapshot.queryParamMap.get('page') || '',
      10
    );
    return Number.isInteger(page) && page > 0 ? page : 1;
  }

  ngOnDestroy(): void {
    this.pageNavigationSubscription?.unsubscribe();
  }
}
