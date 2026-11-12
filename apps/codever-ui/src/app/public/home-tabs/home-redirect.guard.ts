import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
} from '@angular/router';
import { Observable, race, timer } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthenticationService } from '../../core/auth/authentication.service';
import {
  HOME_TABS,
  HomeTabId,
  resolveHomeTabs,
} from '../../core/home-tabs/home-tabs';
import { UserData } from '../../core/model/user-data';
import { UserDataStore } from '../../core/user/userdata.store';

export const HOME_TAB_DATA_TIMEOUT_MS = 1500;

const legacyTabIds: Record<string, HomeTabId> = {
  feed: 'feed',
  history: 'history',
  pinned: 'pinned',
  'read-later': 'read-later',
};

export const homeRedirectGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
) => {
  const router = inject(Router);
  const tabQueryParam = route.queryParamMap.get('tab');
  const page = route.queryParamMap.get('page');
  const queryParams = page ? { page } : {};

  const legacyTabId =
    tabQueryParam && Object.prototype.hasOwnProperty.call(
      legacyTabIds,
      tabQueryParam
    )
      ? legacyTabIds[tabQueryParam]
      : undefined;
  if (legacyTabId) {
    const legacyTab = HOME_TABS.find((tab) => tab.id === legacyTabId);
    return router.createUrlTree([legacyTab.path], { queryParams });
  }

  const authenticationService = inject(AuthenticationService);
  if (!authenticationService.isLoggedIn()) {
    return router.createUrlTree(['/feed'], { queryParams });
  }

  const userData$ = inject(UserDataStore).getUserData$();
  return firstUserDataOrTimeout(userData$).pipe(
    map((userData) => {
      const tabId = userData
        ? resolveHomeTabs(userData.homeTabs)[0]
        : 'feed';
      const tab = HOME_TABS.find((homeTab) => homeTab.id === tabId);
      return router.createUrlTree([tab.path], { queryParams });
    })
  );
};

function firstUserDataOrTimeout(
  userData$: Observable<UserData>
): Observable<UserData | null> {
  return race(
    userData$.pipe(take(1)),
    timer(HOME_TAB_DATA_TIMEOUT_MS).pipe(map(() => null))
  );
}
