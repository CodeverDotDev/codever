import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { SharedLoginReturn } from './shared-login-return.service';

/** Navigation state key asking a shared page to open its copy form once. */
export const SHARED_COPY_REQUEST_STATE = 'sharedCopyRequested';

/**
 * Handles `/shared/continue`, the token-free return address of a login started
 * on a shared page: it takes the remembered entry once and replaces the URL
 * with the shared page, or with the home page when there is none.
 */
export const sharedLoginReturnGuard: CanActivateFn = () => {
  const router = inject(Router);
  const sharedLoginReturn = inject(SharedLoginReturn);
  const entry = sharedLoginReturn.takeOnce();

  if (!entry) {
    return new RedirectCommand(router.parseUrl('/'), { replaceUrl: true });
  }
  return new RedirectCommand(
    router.parseUrl(sharedLoginReturn.sharedPagePath(entry)),
    {
      replaceUrl: true,
      state: entry.copy ? { [SHARED_COPY_REQUEST_STATE]: true } : undefined,
    }
  );
};
