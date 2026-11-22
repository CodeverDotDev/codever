import { describe, expect, it } from 'vitest';
import { routes } from '../app.routing';
import { adminRoutes } from './admin.module';
import { AuthGuard } from '../core/auth/auth-guard.service';

describe('admin routes', () => {
  it('lazy-loads the admin module at /admin', () => {
    const route = routes.find((candidate) => candidate.path === 'admin');

    expect(route?.loadChildren).toBeDefined();
  });

  it('requires the ROLE_ADMIN role through the AuthGuard', () => {
    const [dashboard] = adminRoutes;

    expect(dashboard.canActivate).toEqual([AuthGuard]);
    expect(dashboard.data).toEqual({ roles: ['ROLE_ADMIN'] });
  });

  it('opens the overview by default and has the three areas', () => {
    const children = adminRoutes[0].children.map((child) => child.path);

    expect(adminRoutes[0].children[0]).toMatchObject({
      path: '',
      redirectTo: 'overview',
    });
    expect(children).toEqual([
      '',
      'overview',
      'public-content',
      'audit-log',
    ]);
  });
});
