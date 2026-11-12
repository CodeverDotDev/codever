import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  convertToParamMap,
  provideRouter,
  Router,
  UrlTree,
} from '@angular/router';
import { firstValueFrom, Observable, ReplaySubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthenticationService } from '../../core/auth/authentication.service';
import { HomeTabId } from '../../core/home-tabs/home-tabs';
import { UserData } from '../../core/model/user-data';
import { UserDataStore } from '../../core/user/userdata.store';
import { homeRedirectGuard } from './home-redirect.guard';

describe('homeRedirectGuard', () => {
  let router: Router;
  let userData$: ReplaySubject<UserData>;
  let isLoggedIn: boolean;
  let getUserData$: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    userData$ = new ReplaySubject<UserData>(1);
    isLoggedIn = false;
    getUserData$ = vi.fn(() => userData$.asObservable());
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthenticationService,
          useValue: { isLoggedIn: () => isLoggedIn },
        },
        {
          provide: UserDataStore,
          useValue: { getUserData$ },
        },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('redirects an anonymous visitor to Feed', async () => {
    expect(await getRedirect({})).toBe('/feed');
    expect(getUserData$).not.toHaveBeenCalled();
  });

  it('redirects to the saved first tab for a signed-in user', async () => {
    isLoggedIn = true;
    userData$.next({
      homeTabs: ['pinned', 'feed', 'history', 'read-later'],
    });

    expect(await getRedirect({})).toBe('/pinned');
  });

  it('uses Feed when no valid order is saved', async () => {
    isLoggedIn = true;
    userData$.next({ homeTabs: ['pinned', 'pinned'] as HomeTabId[] });

    expect(await getRedirect({})).toBe('/feed');
  });

  it('redirects a known legacy tab and preserves its page', async () => {
    expect(await getRedirect({ tab: 'read-later', page: '3' })).toBe(
      '/read-later?page=3'
    );
  });

  it('treats an unknown legacy tab as the root URL', async () => {
    isLoggedIn = true;
    userData$.next({
      homeTabs: ['pinned', 'feed', 'history', 'read-later'],
    });

    expect(await getRedirect({ tab: 'favorites' })).toBe('/pinned');
  });

  it('falls back to Feed when user data does not arrive before timeout', async () => {
    isLoggedIn = true;
    userData$ = new ReplaySubject<UserData>(1);
    getUserData$.mockReturnValue(userData$.asObservable());

    expect(await getRedirect({})).toBe('/feed');
  });

  async function getRedirect(
    params: Record<string, string>
  ): Promise<string> {
    const route = {
      queryParamMap: convertToParamMap(params),
    } as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() =>
      homeRedirectGuard(route, {} as never)
    );
    const urlTree =
      result instanceof UrlTree
        ? result
        : await firstValueFrom(result as Observable<UrlTree>);

    return router.serializeUrl(urlTree);
  }
});
