import { effect, inject } from '@angular/core';
import Keycloak from 'keycloak-js';
import { KEYCLOAK_EVENT_SIGNAL, KeycloakEventType } from 'keycloak-angular';
import { UserDataStore } from './core/user/userdata.store';
import { SystemService } from './core/cache/system.service';

/**
 * Wires up Keycloak lifecycle event handling using the keycloak-angular v19
 * signal API.
 *
 * Registered through `provideAppInitializer`, so it executes inside an injection
 * context once the app providers (including `provideKeycloak`, which initializes
 * Keycloak) are set up. `KEYCLOAK_EVENT_SIGNAL` holds the latest Keycloak event
 * and the `effect` reacts to every subsequent event.
 *
 * Note: the initial "user is already logged in on page load" data load is handled
 * deterministically in `AppComponent` (via `keycloak.authenticated` +
 * `loadInitialUserDataFromDb`), because the event signal only retains the latest
 * event and the transient `AuthSuccess` may already be superseded by `Ready` by
 * the time this effect first runs. This effect covers the ongoing session events.
 */
export function initializeKeycloakEvents(): void {
  const keycloak = inject(Keycloak);
  const keycloakSignal = inject(KEYCLOAK_EVENT_SIGNAL);
  const userDataStore = inject(UserDataStore);
  const systemService = inject(SystemService);

  systemService.checkVersion();

  effect(() => {
    const event = keycloakSignal();

    switch (event.type) {
      case KeycloakEventType.AuthLogout:
        userDataStore.resetUserDataStore();
        break;
      case KeycloakEventType.TokenExpired:
        keycloak.updateToken(20);
        break;
    }
  });
}
