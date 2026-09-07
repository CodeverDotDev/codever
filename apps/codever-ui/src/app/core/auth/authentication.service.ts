import { Injectable } from '@angular/core';
import Keycloak, { KeycloakLoginOptions } from 'keycloak-js';

/**
 * Thin wrapper around the keycloak-js {@link Keycloak} instance provided by
 * `provideKeycloak` (keycloak-angular v19+).
 *
 * It preserves the small subset of the previously used (now removed)
 * `KeycloakService` API that the application relies on, so feature code can keep
 * calling `isLoggedIn()`, `login()`, `isUserInRole()` and `getKeycloakInstance()`
 * without depending on the deprecated service.
 */
@Injectable()
export class AuthenticationService {
  constructor(private readonly keycloak: Keycloak) {}

  /** True when the user is authenticated. */
  isLoggedIn(): boolean {
    return !!this.keycloak.authenticated;
  }

  /** Redirects to the Keycloak login page. */
  login(options?: KeycloakLoginOptions): Promise<void> {
    return this.keycloak.login(options);
  }

  /** Checks realm and client (resource) roles for the given role. */
  isUserInRole(role: string): boolean {
    return (
      this.keycloak.hasRealmRole(role) || this.keycloak.hasResourceRole(role)
    );
  }

  /** Refreshes the token if it expires within `minValidity` seconds. */
  updateToken(minValidity?: number): Promise<boolean> {
    return this.keycloak.updateToken(minValidity);
  }

  /** Returns the underlying keycloak-js instance for low-level access. */
  getKeycloakInstance(): Keycloak {
    return this.keycloak;
  }
}

