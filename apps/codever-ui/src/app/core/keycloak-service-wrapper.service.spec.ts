import { afterEach, describe, expect, it, vi } from 'vitest';
import { Router } from '@angular/router';
import Keycloak from 'keycloak-js';

import {
  KeycloakServiceWrapper,
  SHARED_LOGIN_RETURN_PATH,
} from './keycloak-service-wrapper.service';
import { SharedLoginReturn } from './sharing/shared-login-return.service';
import { environment } from '../../environments/environment';

const token = 'aB3_-xYzSecretToken';

const create = (url: string) => {
  const router = { routerState: { snapshot: { url } } } as unknown as Router;
  const keycloak = { login: vi.fn() } as unknown as Keycloak;
  const sharedLoginReturn = new SharedLoginReturn();
  const wrapper = new KeycloakServiceWrapper(
    router,
    keycloak,
    sharedLoginReturn
  );
  return { wrapper, keycloak, sharedLoginReturn };
};

describe('KeycloakServiceWrapper.login', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('keeps the current page as return address on other pages', () => {
    const { wrapper, keycloak } = create('/search?q=angular');

    wrapper.login();

    expect(keycloak.login).toHaveBeenCalledWith({
      redirectUri: environment.APP_HOME_URL + '/search?q=angular',
    });
    expect(sessionStorage.length).toBe(0);
  });

  it('sends a token-free return address from a shared page', () => {
    const { wrapper, keycloak, sharedLoginReturn } = create(
      `/notes/shared/${token}`
    );

    wrapper.login({ copyAfterLogin: true });

    const options = vi.mocked(keycloak.login).mock.calls[0][0];
    expect(options.redirectUri).toBe(
      environment.APP_HOME_URL + SHARED_LOGIN_RETURN_PATH
    );
    expect(JSON.stringify(options)).not.toContain(token);
    expect(sharedLoginReturn.takeOnce()).toEqual({
      type: 'note',
      token,
      copy: true,
    });
  });

  it('remembers a plain login from a shared bookmark page', () => {
    const { wrapper, sharedLoginReturn } = create(
      `/bookmarks/shared/${token}`
    );

    wrapper.login();

    expect(sharedLoginReturn.takeOnce()).toEqual({
      type: 'bookmark',
      token,
      copy: false,
    });
  });

  it('returns to home without the token when the tab cannot store it', () => {
    const { wrapper, keycloak } = create(`/notes/shared/${token}`);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });

    wrapper.login({ copyAfterLogin: true });

    expect(keycloak.login).toHaveBeenCalledWith({
      redirectUri: environment.APP_HOME_URL,
    });
  });
});
