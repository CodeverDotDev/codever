import { describe, expect, it, vi } from 'vitest';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import Keycloak from 'keycloak-js';
import { AuthGuard } from './auth-guard.service';

const createGuard = (keycloak: Partial<Keycloak>) => {
  const homeTree = {} as UrlTree;
  const router = { parseUrl: vi.fn().mockReturnValue(homeTree) };
  const guard = new AuthGuard(
    keycloak as Keycloak,
    router as unknown as Router
  );
  return { guard, router, homeTree };
};

const route = (roles?: string[]) =>
  ({ data: roles ? { roles } : {} }) as unknown as ActivatedRouteSnapshot;
const state = { url: '/admin' } as RouterStateSnapshot;

describe('AuthGuard', () => {
  it('lets a user with the required role through', async () => {
    const { guard } = createGuard({
      authenticated: true,
      hasRealmRole: vi.fn().mockReturnValue(true),
      hasResourceRole: vi.fn().mockReturnValue(false),
    });

    await expect(guard.canActivate(route(['ROLE_ADMIN']), state)).resolves.toBe(
      true
    );
  });

  it('sends a logged-in user without the role to the home page', async () => {
    const { guard, router, homeTree } = createGuard({
      authenticated: true,
      hasRealmRole: vi.fn().mockReturnValue(false),
      hasResourceRole: vi.fn().mockReturnValue(false),
    });

    await expect(guard.canActivate(route(['ROLE_ADMIN']), state)).resolves.toBe(
      homeTree
    );
    expect(router.parseUrl).toHaveBeenCalledWith('/');
  });

  it('lets any logged-in user through when no role is required', async () => {
    const { guard } = createGuard({ authenticated: true });

    await expect(guard.canActivate(route(), state)).resolves.toBe(true);
  });

  it('sends an anonymous visitor to login and back to the page', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    const { guard } = createGuard({ authenticated: false, login });

    await expect(guard.canActivate(route(['ROLE_ADMIN']), state)).resolves.toBe(
      false
    );
    expect(login).toHaveBeenCalledWith({
      redirectUri: window.location.origin + '/admin',
    });
  });
});
