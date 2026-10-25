import { describe, expect, it } from 'vitest';
import { routes } from './app.routing';

describe('legacy dashboard route redirects', () => {
  it.each([
    { path: 'my-bookmarks', redirectTo: '/dashboard/bookmarks' },
    { path: 'my-notes', redirectTo: '/dashboard/notes' },
  ])('redirects exact /$path navigation to $redirectTo', ({ path, redirectTo }) => {
      const routeIndex = routes.findIndex((route) => route.path === path);
      const redirectRoute = routes[routeIndex];
      const nestedRoutesRoute = routes
        .slice(routeIndex + 1)
        .find((route) => route.path === path);

      expect(redirectRoute).toMatchObject({
        path,
        pathMatch: 'full',
        redirectTo,
      });
      expect(nestedRoutesRoute?.loadChildren).toBeDefined();
    });
});
