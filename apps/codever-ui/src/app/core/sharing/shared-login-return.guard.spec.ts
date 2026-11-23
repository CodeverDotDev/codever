import { afterEach, describe, expect, it } from 'vitest';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Location } from '@angular/common';

import {
  SHARED_COPY_REQUEST_STATE,
  sharedLoginReturnGuard,
} from './shared-login-return.guard';
import { SharedLoginReturn } from './shared-login-return.service';

@Component({ template: '' })
class BlankComponent {}

const token = 'aB3_-xYz';

const setup = async () => {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        {
          path: 'shared/continue',
          canActivate: [sharedLoginReturnGuard],
          children: [],
        },
        { path: 'notes/shared/:token', component: BlankComponent },
        { path: 'bookmarks/shared/:token', component: BlankComponent },
        { path: '', component: BlankComponent },
      ]),
    ],
  });
  const router = TestBed.inject(Router);
  const location = TestBed.inject(Location);
  const sharedLoginReturn = TestBed.inject(SharedLoginReturn);
  return { router, location, sharedLoginReturn };
};

describe('sharedLoginReturnGuard', () => {
  afterEach(() => sessionStorage.clear());

  it('returns to the shared note with the copy request', async () => {
    const { router, location, sharedLoginReturn } = await setup();
    sharedLoginReturn.remember(`/notes/shared/${token}`, true);

    await router.navigateByUrl('/shared/continue');

    expect(location.path()).toBe(`/notes/shared/${token}`);
    expect((location.getState() as Record<string, unknown>)?.[SHARED_COPY_REQUEST_STATE]).toBe(true);
    expect(sharedLoginReturn.takeOnce()).toBeUndefined();
  });

  it('returns to the shared bookmark without a copy request', async () => {
    const { router, location, sharedLoginReturn } = await setup();
    sharedLoginReturn.remember(`/bookmarks/shared/${token}`, false);

    await router.navigateByUrl('/shared/continue');

    expect(location.path()).toBe(`/bookmarks/shared/${token}`);
    expect((location.getState() as Record<string, unknown>)?.[SHARED_COPY_REQUEST_STATE]).toBeUndefined();
  });

  it('goes home without a remembered entry', async () => {
    const { router, location } = await setup();

    await router.navigateByUrl('/shared/continue');

    expect(location.path()).toBe('');
  });
});
