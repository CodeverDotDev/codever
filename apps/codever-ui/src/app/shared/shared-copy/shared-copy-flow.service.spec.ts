import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { SharedCopyFlow } from './shared-copy-flow.service';
import { SharedCopyHandoff } from '../../core/sharing/shared-copy-handoff.service';
import { SHARED_COPY_REQUEST_STATE } from '../../core/sharing/shared-login-return.guard';
import { LoginRequiredDialogComponent } from '../dialog/login-required-dialog/login-required-dialog.component';

describe('SharedCopyFlow', () => {
  const token = 'aB3_-xYzSecretToken';
  const note = { _id: 'n1', title: 'Shared note' };
  const bookmark = { _id: 'b1', name: 'Shared bookmark' };

  let loggedIn: boolean;
  let state: Record<string, unknown> | null;
  let handoff: SharedCopyHandoff;
  let router: { navigate: ReturnType<typeof vi.fn> };
  let location: {
    getState: () => unknown;
    path: () => string;
    replaceState: ReturnType<typeof vi.fn>;
  };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let flow: SharedCopyFlow;

  beforeEach(() => {
    loggedIn = true;
    state = null;
    handoff = new SharedCopyHandoff();
    router = { navigate: vi.fn() };
    location = {
      getState: () => state,
      path: () => `/notes/shared/${token}`,
      replaceState: vi.fn(),
    };
    dialog = { open: vi.fn() };
    flow = new SharedCopyFlow(
      { isLoggedIn: () => loggedIn } as never,
      handoff,
      router as unknown as Router,
      location as unknown as Location,
      dialog as unknown as MatDialog
    );
  });

  it('hands a note over and opens the note copy page without the token', () => {
    flow.start('note', note);

    expect(router.navigate).toHaveBeenCalledWith([
      '/my-notes',
      'n1',
      'copy-to-mine',
    ]);
    expect(JSON.stringify(router.navigate.mock.calls)).not.toContain(token);
    expect(handoff.take('note', 'n1')).toBe(note);
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('opens the bookmark copy page for bookmarks', () => {
    flow.start('bookmark', bookmark);

    expect(router.navigate).toHaveBeenCalledWith([
      '/my-bookmarks',
      'b1',
      'copy-to-mine',
    ]);
    expect(handoff.take('bookmark', 'b1')).toBe(bookmark);
  });

  it('asks logged-out visitors to log in or register', () => {
    loggedIn = false;

    flow.start('note', note);

    expect(router.navigate).not.toHaveBeenCalled();
    expect(handoff.take('note', 'n1')).toBeUndefined();
    const [component, config] = dialog.open.mock.calls[0];
    expect(component).toBe(LoginRequiredDialogComponent);
    expect(config.data.copyAfterLogin).toBe(true);
    expect(config.data.message).toContain('register');
  });

  it('takes the copy request once and removes it from the history entry', () => {
    state = { navigationId: 3, [SHARED_COPY_REQUEST_STATE]: true };

    expect(flow.takeCopyRequest()).toBe(true);
    expect(location.replaceState).toHaveBeenCalledWith(
      `/notes/shared/${token}`,
      '',
      { navigationId: 3 }
    );
  });

  it('has no copy request without the state or when logged out', () => {
    expect(flow.takeCopyRequest()).toBe(false);

    loggedIn = false;
    state = { [SHARED_COPY_REQUEST_STATE]: true };
    expect(flow.takeCopyRequest()).toBe(false);
    expect(location.replaceState).toHaveBeenCalled();
  });
});
