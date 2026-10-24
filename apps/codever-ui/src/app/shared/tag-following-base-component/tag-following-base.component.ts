import { Component, ChangeDetectionStrategy } from '@angular/core';
import { UserDataWatchedTagsStore } from '../../core/user/userdata.watched-tags.store';
import { Observable, of } from 'rxjs';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { LoginRequiredDialogComponent } from '../dialog/login-required-dialog/login-required-dialog.component';

@Component({ changeDetection: ChangeDetectionStrategy.Eager, template: '' })
export class TagFollowingBaseComponent {
  verifyForWatchedTag: Observable<string>;

  constructor(
    public loginDialog: MatDialog,
    public userDataWatchedTagsStore: UserDataWatchedTagsStore
  ) {}

  onDropDownClick(tag: string) {
    this.verifyForWatchedTag = of(tag);
  }

  watchTag(tag: string, userIsLoggedIn: boolean) {
    if (!userIsLoggedIn) {
      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
      dialogConfig.data = {
        message: 'You need to be logged in to follow tags',
      };

      this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    } else {
      this.userDataWatchedTagsStore.watchTag(tag);
    }
  }

  unwatchTag(tag: string) {
    this.userDataWatchedTagsStore.unwatchTag(tag);
  }

  ignoreTag(tag: string, userIsLoggedIn: boolean) {
    if (!userIsLoggedIn) {
      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
      dialogConfig.data = {
        message: 'You need to be logged in to ignore tags',
      };

      this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    } else {
      this.userDataWatchedTagsStore.ignoreTag(tag);
    }
  }

  unignoreTag(tag: string) {
    this.userDataWatchedTagsStore.unignoreTag(tag);
  }
}
