import { NO_ERRORS_SCHEMA, provideZoneChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ScrollStrategyOptions } from '@angular/cdk/overlay';
import { SwUpdate } from '@angular/service-worker';
import { NEVER, of } from 'rxjs';
import Keycloak from 'keycloak-js';
import { describe, expect, it } from 'vitest';

import { AppComponent } from './app.component';
import { UserInfoStore } from './core/user/user-info.store';
import { UserDataStore } from './core/user/userdata.store';
import { UserDataHistoryStore } from './core/user/userdata.history.store';
import { UserDataPinnedStore } from './core/user/userdata.pinned.store';
import { LoginDialogHelperService } from './core/login-dialog-helper.service';

/**
 * The sidebar shows an Admin link right under Dashboard, only for users with
 * the ROLE_ADMIN realm role. Child components are left out of the template.
 */
const renderSidebar = (keycloak: Partial<Keycloak>) => {
  // `ngOnInit` reads `#favicon` in non-production builds; jsdom starts
  // without it.
  if (!document.querySelector('#favicon')) {
    const link = document.createElement('link');
    link.id = 'favicon';
    document.head.appendChild(link);
  }

  TestBed.configureTestingModule({
    imports: [AppComponent],
    providers: [
      provideZoneChangeDetection(),
      provideRouter([]),
      { provide: Keycloak, useValue: keycloak },
      { provide: UserInfoStore, useValue: { getUserInfoOidc$: () => NEVER } },
      {
        provide: UserDataStore,
        useValue: {
          getUserData$: () =>
            of({ welcomeAck: true, acknowledgedNotifications: ['whats-new'] }),
        },
      },
      { provide: UserDataHistoryStore, useValue: {} },
      { provide: UserDataPinnedStore, useValue: {} },
      { provide: MatDialog, useValue: { open: () => undefined } },
      { provide: LoginDialogHelperService, useValue: {} },
      { provide: ScrollStrategyOptions, useValue: { noop: () => ({}) } },
      {
        provide: SwUpdate,
        useValue: {
          isEnabled: false,
          versionUpdates: NEVER,
          checkForUpdate: () => Promise.resolve(false),
          activateUpdate: () => Promise.resolve(true),
        },
      },
    ],
  });
  TestBed.overrideComponent(AppComponent, {
    set: { imports: [RouterLink, AsyncPipe], schemas: [NO_ERRORS_SCHEMA] },
  });

  const fixture = TestBed.createComponent(AppComponent);
  fixture.detectChanges();
  return (fixture.nativeElement as HTMLElement).querySelector(
    '#sidebar-wrapper'
  );
};

const sidebarLabels = (sidebar: Element) =>
  Array.from(sidebar.querySelectorAll('a.list-group-item')).map((link) =>
    link.textContent.trim()
  );

describe('AppComponent sidebar admin link', () => {
  it('shows Admin directly under Dashboard for administrators', () => {
    const sidebar = renderSidebar({
      authenticated: true,
      hasRealmRole: (role: string) => role === 'ROLE_ADMIN',
    });

    const labels = sidebarLabels(sidebar);
    expect(labels[labels.indexOf('Dashboard') + 1]).toBe('Admin');
    expect(
      sidebar.querySelector('a.sidebar-admin-link').getAttribute('href')
    ).toBe('/admin');
  });

  it('shows no Admin link to other users', () => {
    const sidebar = renderSidebar({
      authenticated: true,
      hasRealmRole: () => false,
    });

    expect(sidebarLabels(sidebar)).toContain('Dashboard');
    expect(sidebar.querySelector('a.sidebar-admin-link')).toBeNull();
  });

  it('shows no Admin link when nobody is logged in', () => {
    const sidebar = renderSidebar({ authenticated: false });

    expect(sidebar.querySelector('a.sidebar-admin-link')).toBeNull();
  });
});
