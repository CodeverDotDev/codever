import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

import { AuthenticationService } from '../../core/auth/authentication.service';
import { ShareableResourceType } from '../../core/model/share-link';
import { SharedCopyHandoff } from '../../core/sharing/shared-copy-handoff.service';
import { SHARED_COPY_REQUEST_STATE } from '../../core/sharing/shared-login-return.guard';
import { LoginRequiredDialogComponent } from '../dialog/login-required-dialog/login-required-dialog.component';

const COPY_PAGES: Record<ShareableResourceType, string> = {
  note: 'my-notes',
  bookmark: 'my-bookmarks',
};

const LOGIN_MESSAGES: Record<ShareableResourceType, string> = {
  note: 'Log in or register to save a copy of this note to your own notes.',
  bookmark:
    'Log in or register to save a copy of this bookmark to your own bookmarks.',
};

/**
 * "Copy to mine" on the shared note and bookmark pages. The sharing token
 * never leaves the shared page: the content is handed to the copy page in
 * memory, and a login goes through the token-free return address.
 */
@Injectable({ providedIn: 'root' })
export class SharedCopyFlow {
  constructor(
    private authenticationService: AuthenticationService,
    private handoff: SharedCopyHandoff,
    private router: Router,
    private location: Location,
    private loginDialog: MatDialog
  ) {}

  start<T extends { _id?: string }>(
    type: ShareableResourceType,
    content: T
  ): void {
    if (this.authenticationService.isLoggedIn()) {
      this.handoff.put(type, content);
      this.router.navigate([`/${COPY_PAGES[type]}`, content._id, 'copy-to-mine']);
      return;
    }

    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.data = { message: LOGIN_MESSAGES[type], copyAfterLogin: true };
    this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
  }

  /**
   * Returns true once if the page was opened after a login started from
   * "Copy to mine", and removes the request from the history entry so a
   * reload or a back navigation does not open the copy form again.
   */
  takeCopyRequest(): boolean {
    const state = this.location.getState() as Record<string, unknown> | null;
    if (!state?.[SHARED_COPY_REQUEST_STATE]) {
      return false;
    }
    const rest = { ...state };
    delete rest[SHARED_COPY_REQUEST_STATE];
    this.location.replaceState(this.location.path(), '', rest);
    return this.authenticationService.isLoggedIn();
  }
}
