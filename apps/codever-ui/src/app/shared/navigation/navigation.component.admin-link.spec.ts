import { describe, expect, it, vi } from 'vitest';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { NavigationComponent } from './navigation.component';
import { SearchbarComponent } from '../search/searchbar.component';
import { AppService } from '../../app.service';
import { AuthenticationService } from '../../core/auth/authentication.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { UserDataStore } from '../../core/user/userdata.store';
import { LocalStorageService } from '../../core/cache/local-storage.service';
import { KeycloakServiceWrapper } from '../../core/keycloak-service-wrapper.service';
import { FeatureToggleService } from '../../core/feature-toggle.service';
import { EditorProtectionRegistry } from '../../core/editor-protection/editor-protection.registry';

const render = (isAdmin: boolean) => {
  TestBed.configureTestingModule({
    imports: [NavigationComponent],
    providers: [
      provideRouter([]),
      { provide: AppService, useValue: { clickLogo: vi.fn() } },
      {
        provide: AuthenticationService,
        useValue: {
          isLoggedIn: () => true,
          isUserInRole: (role: string) => isAdmin && role === 'ROLE_ADMIN',
        },
      },
      {
        provide: UserInfoStore,
        useValue: {
          getUserInfoOidc$: () => of({ name: 'Ada', email: 'ada@example.com' }),
        },
      },
      { provide: UserDataStore, useValue: { getUserData$: () => of({}) } },
      { provide: LocalStorageService, useValue: {} },
      { provide: KeycloakServiceWrapper, useValue: {} },
      {
        provide: FeatureToggleService,
        useValue: {
          isAiAssistantEnabled: () => of(false),
          isMcpServerEnabled: () => of(false),
        },
      },
      { provide: EditorProtectionRegistry, useValue: {} },
    ],
  });
  TestBed.overrideComponent(NavigationComponent, {
    remove: { imports: [SearchbarComponent] },
    add: { schemas: [NO_ERRORS_SCHEMA] },
  });
  const fixture = TestBed.createComponent(NavigationComponent);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
};

describe('NavigationComponent admin link', () => {
  it('shows an Admin link to /admin for administrators', () => {
    const link = render(true).querySelector('a.admin-link');

    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe('/admin');
  });

  it('shows no Admin link to other users', () => {
    expect(render(false).querySelector('a.admin-link')).toBeNull();
  });
});
