import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AuthenticationService } from '../../core/auth/authentication.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { UserDataStore } from '../../core/user/userdata.store';
import { UserDashboardComponent } from './user-dashboard.component';

describe('Dashboard tab query mapping', () => {
  it('activates the shared tab from a direct query parameter', () => {
    const dashboard = createDashboardForTab('shared');

    expect(dashboard.selectedTabIndex).toBe(6);
  });

  it('preserves existing tab names, legacy snippets, and indexes', () => {
    expect(createDashboardForTab('bookmarks').selectedTabIndex).toBe(0);
    expect(createDashboardForTab('notes').selectedTabIndex).toBe(1);
    expect(createDashboardForTab('snippets').selectedTabIndex).toBe(1);
    expect(createDashboardForTab('followers').selectedTabIndex).toBe(5);

    const dashboard = createDashboardForTab('notes');
    dashboard.tabChanged(5);

    expect(dashboard.selectedTabIndex).toBe(5);
  });

  it('writes the shared tab name to the query parameter', () => {
    const router = { navigate: vi.fn() };
    const dashboard = createDashboardForTab('bookmarks', router);

    dashboard.tabChanged(6);

    expect(router.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: { tab: 'shared', page: null },
      })
    );
  });
});

function createDashboardForTab(
  tab: string,
  router = { navigate: vi.fn() }
): UserDashboardComponent {
  const dashboard = new UserDashboardComponent(
    { isLoggedIn: () => true } as unknown as AuthenticationService,
    { getUserInfoOidc$: () => of({ sub: 'owner' }) } as unknown as UserInfoStore,
    { getUserData$: () => of({}) } as unknown as UserDataStore,
    {
      snapshot: { queryParamMap: { get: () => tab } },
    } as unknown as ActivatedRoute,
    router as unknown as Router
  );
  dashboard.ngOnInit();
  return dashboard;
}
