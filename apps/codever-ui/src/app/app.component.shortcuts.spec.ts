import { provideZoneChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ScrollStrategyOptions } from '@angular/cdk/overlay';
import { SwUpdate } from '@angular/service-worker';
import { NEVER, of } from 'rxjs';
import Keycloak from 'keycloak-js';
import { AppComponent } from './app.component';
import { UserInfoStore } from './core/user/user-info.store';
import { UserDataStore } from './core/user/userdata.store';
import { UserDataHistoryStore } from './core/user/userdata.history.store';
import { UserDataPinnedStore } from './core/user/userdata.pinned.store';
import { LoginDialogHelperService } from './core/login-dialog-helper.service';

/**
 * Focused coverage for the Pinned and History quick-access keyboard shortcuts.
 *
 * The component template is replaced with an empty one so the heavy feature
 * components it composes are not instantiated; the `window:keydown` host
 * listeners under test are independent of the template. Real `keydown` events
 * are dispatched on `window` so Angular's key-event matching is exercised,
 * which is what decides whether the old vs new combinations fire.
 */
describe('AppComponent quick-access shortcuts', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;
  let launchPinned: jasmine.Spy;
  let launchHistory: jasmine.Spy;
  let loginDialogOpen: jasmine.Spy;

  const pressKey = (init: KeyboardEventInit): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', {
      cancelable: true,
      ...init,
    });
    window.dispatchEvent(event);
    return event;
  };

  beforeEach(() => {
    // `ngOnInit` reads `#favicon` in non-production builds; Karma's page has none.
    if (!document.querySelector('#favicon')) {
      const link = document.createElement('link');
      link.id = 'favicon';
      document.head.appendChild(link);
    }

    loginDialogOpen = jasmine.createSpy('matDialogOpen');

    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideZoneChangeDetection(),
        provideRouter([]),
        { provide: Keycloak, useValue: { authenticated: false } },
        { provide: UserInfoStore, useValue: { getUserInfoOidc$: () => NEVER } },
        {
          provide: UserDataStore,
          useValue: {
            loadInitialUserDataFromDb: () => of(undefined),
            getUserData$: () => of({ acknowledgedNotifications: [] }),
            acknowledgeNotification$: () => undefined,
            updateWelcomeAcknowledge$: () => undefined,
          },
        },
        {
          provide: UserDataHistoryStore,
          useValue: { getHistory$: () => of([]) },
        },
        {
          provide: UserDataPinnedStore,
          useValue: { getPinnedResources$: () => of([]) },
        },
        { provide: MatDialog, useValue: { open: loginDialogOpen } },
        {
          provide: LoginDialogHelperService,
          useValue: { loginDialogConfig: () => ({}) },
        },
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

    TestBed.overrideComponent(AppComponent, { set: { template: '' } });

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    launchPinned = spyOn(component as any, 'launchPinnedDialog');
    launchHistory = spyOn(component as any, 'launchHistoryDialog');
  });

  it('opens the Pinned dialog on Ctrl+Shift+P', () => {
    component.userIsLoggedIn = true;

    const event = pressKey({ key: 'P', ctrlKey: true, shiftKey: true });

    expect(launchPinned).toHaveBeenCalledTimes(1);
    expect(launchHistory).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBeTrue();
  });

  it('opens the Pinned dialog on Cmd+Shift+P', () => {
    component.userIsLoggedIn = true;

    const event = pressKey({ key: 'P', metaKey: true, shiftKey: true });

    expect(launchPinned).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBeTrue();
  });

  it('opens the History dialog on Ctrl+Shift+H', () => {
    component.userIsLoggedIn = true;

    const event = pressKey({ key: 'H', ctrlKey: true, shiftKey: true });

    expect(launchHistory).toHaveBeenCalledTimes(1);
    expect(launchPinned).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBeTrue();
  });

  it('opens the History dialog on Cmd+Shift+H', () => {
    component.userIsLoggedIn = true;

    const event = pressKey({ key: 'H', metaKey: true, shiftKey: true });

    expect(launchHistory).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBeTrue();
  });

  it('prompts for login and suppresses the browser action on Ctrl+Shift+P when signed out', () => {
    component.userIsLoggedIn = false;

    const event = pressKey({ key: 'P', ctrlKey: true, shiftKey: true });

    expect(launchPinned).not.toHaveBeenCalled();
    expect(loginDialogOpen).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBeTrue();
  });

  it('prompts for login and suppresses the browser action on Ctrl+Shift+H when signed out', () => {
    component.userIsLoggedIn = false;

    const event = pressKey({ key: 'H', ctrlKey: true, shiftKey: true });

    expect(launchHistory).not.toHaveBeenCalled();
    expect(loginDialogOpen).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBeTrue();
  });

  it('ignores the old Ctrl+P / Ctrl+H combinations and leaves the browser default alone', () => {
    component.userIsLoggedIn = true;

    const printEvent = pressKey({ key: 'P', ctrlKey: true });
    const historyEvent = pressKey({ key: 'H', ctrlKey: true });

    expect(launchPinned).not.toHaveBeenCalled();
    expect(launchHistory).not.toHaveBeenCalled();
    expect(loginDialogOpen).not.toHaveBeenCalled();
    expect(printEvent.defaultPrevented).toBeFalse();
    expect(historyEvent.defaultPrevented).toBeFalse();
  });

  it('ignores Cmd+P / Cmd+H (the macOS browser defaults)', () => {
    component.userIsLoggedIn = true;

    const printEvent = pressKey({ key: 'P', metaKey: true });
    const historyEvent = pressKey({ key: 'H', metaKey: true });

    expect(launchPinned).not.toHaveBeenCalled();
    expect(launchHistory).not.toHaveBeenCalled();
    expect(printEvent.defaultPrevented).toBeFalse();
    expect(historyEvent.defaultPrevented).toBeFalse();
  });
});
