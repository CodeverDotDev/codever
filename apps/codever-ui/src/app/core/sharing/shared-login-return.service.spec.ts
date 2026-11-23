import { afterEach, describe, expect, it } from 'vitest';
import {
  SHARED_LOGIN_RETURN_KEY,
  SHARED_LOGIN_RETURN_MAX_AGE_MS,
  SharedLoginReturn,
} from './shared-login-return.service';

describe('SharedLoginReturn', () => {
  const service = new SharedLoginReturn();
  const token = 'aB3_-xYz';
  const now = 1_800_000_000_000;

  afterEach(() => sessionStorage.clear());

  it('recognises shared note and bookmark pages only', () => {
    expect(service.isSharedPage(`/notes/shared/${token}`)).toBe(true);
    expect(service.isSharedPage(`/bookmarks/shared/${token}?x=1`)).toBe(true);
    expect(service.isSharedPage('/notes/abc/details')).toBe(false);
    expect(service.isSharedPage('/dashboard')).toBe(false);
    expect(service.isSharedPage('/notes/shared/')).toBe(false);
  });

  it('remembers a shared page and returns it once', () => {
    expect(service.remember(`/notes/shared/${token}`, true, now)).toBe(true);

    expect(service.takeOnce(now + 1000)).toEqual({
      type: 'note',
      token,
      copy: true,
    });
    expect(sessionStorage.getItem(SHARED_LOGIN_RETURN_KEY)).toBeNull();
    expect(service.takeOnce(now + 2000)).toBeUndefined();
  });

  it('remembers the bookmark type and a plain login', () => {
    service.remember(`/bookmarks/shared/${token}`, false, now);

    expect(service.takeOnce(now)).toEqual({
      type: 'bookmark',
      token,
      copy: false,
    });
  });

  it('stores nothing for other pages', () => {
    expect(service.remember('/dashboard', true, now)).toBe(false);
    expect(sessionStorage.getItem(SHARED_LOGIN_RETURN_KEY)).toBeNull();
  });

  it('drops an expired entry', () => {
    service.remember(`/notes/shared/${token}`, true, now);

    expect(
      service.takeOnce(now + SHARED_LOGIN_RETURN_MAX_AGE_MS + 1)
    ).toBeUndefined();
    expect(sessionStorage.getItem(SHARED_LOGIN_RETURN_KEY)).toBeNull();
  });

  it('drops a malformed entry', () => {
    sessionStorage.setItem(SHARED_LOGIN_RETURN_KEY, '{not json');
    expect(service.takeOnce(now)).toBeUndefined();
    expect(sessionStorage.getItem(SHARED_LOGIN_RETURN_KEY)).toBeNull();

    sessionStorage.setItem(
      SHARED_LOGIN_RETURN_KEY,
      JSON.stringify({ type: 'note', token: '../x', copy: true, savedAt: now })
    );
    expect(service.takeOnce(now)).toBeUndefined();
  });

  it('builds the shared page path', () => {
    expect(service.sharedPagePath({ type: 'note', token, copy: false })).toBe(
      `/notes/shared/${token}`
    );
    expect(
      service.sharedPagePath({ type: 'bookmark', token, copy: true })
    ).toBe(`/bookmarks/shared/${token}`);
  });
});
