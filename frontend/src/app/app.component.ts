import { Component, HostListener, OnInit } from '@angular/core';

import 'styles.scss';
import { UserDataHistoryStore } from './core/user/userdata.history.store';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { HotKeysDialogComponent } from './shared/dialog/history-dialog/hot-keys-dialog.component';
import { UserDataPinnedStore } from './core/user/userdata.pinned.store';
import { UserInfoStore } from './core/user/user-info.store';
import { KeycloakService } from 'keycloak-angular';
import { LoginRequiredDialogComponent } from './shared/dialog/login-required-dialog/login-required-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {

  url = 'https://www.bookmarks.dev';
  innerWidth: any;

  userIsLoggedIn = false;
  userId: string;

  constructor(private keycloakService: KeycloakService,
              private userInfoStore: UserInfoStore,
              private userDataHistoryStore: UserDataHistoryStore,
              private userDataPinnedStore: UserDataPinnedStore,
              private historyDialog: MatDialog,
              private loginDialog: MatDialog) {
    this.innerWidth = 100;
  }

  ngOnInit(): void {
    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.userIsLoggedIn = true;
        this.userInfoStore.getUserInfo$().subscribe(userInfo => {
          this.userId = userInfo.sub;
        });
      }
    });
  }

  @HostListener('window:keydown.control.p', ['$event'])
  showPinned(event: KeyboardEvent) {
    if (!this.userIsLoggedIn) {
      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
      dialogConfig.data = {
        message: 'You need to be logged in to see the Pinned Bookmarks popup'
      };

      this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    } else {
      event.preventDefault();
      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = false;
      dialogConfig.autoFocus = true;
      dialogConfig.width = this.getRelativeWidth();
      dialogConfig.height = this.getRelativeHeight();
      dialogConfig.data = {
        bookmarks$: this.userDataPinnedStore.getPinnedBookmarks$(this.userId, 1),
        title: '<i class="fas fa-thumbtack"></i> Pinned'
      };

      const dialogRef = this.historyDialog.open(HotKeysDialogComponent, dialogConfig);
      dialogRef.afterClosed().subscribe(
        data => {
          console.log('Dialog output:', data);
        }
      );
    }
  }

  private getRelativeWidth() {
    let relativeWidth = (window.innerWidth * 80) / 100;
    if (window.innerWidth > 1500) {
      relativeWidth = (1500 * 80) / 100;
    }

    return relativeWidth + 'px';
  }

  private getRelativeHeight() {
    let relativeHeight = (window.innerHeight * 80) / 100;
    if (window.innerHeight > 1200) {
      relativeHeight = (1200 * 80) / 100;
    }

    return relativeHeight + 'px';
  }

  @HostListener('window:keydown.control.h', ['$event'])
  showHistory(event: KeyboardEvent) {
    if (!this.userIsLoggedIn) {
      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;
      dialogConfig.data = {
        message: 'You need to be logged in to see the History Bookmarks popup'
      };

      this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    } else {
      event.preventDefault();
      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = false;
      dialogConfig.autoFocus = true;
      dialogConfig.width = this.getRelativeWidth();
      dialogConfig.height = this.getRelativeHeight();
      const lastNoBookmarksToShowInHistoryDialog = 20;
      dialogConfig.data = {
        bookmarks$: this.userDataHistoryStore.getHistory$(this.userId, 1, lastNoBookmarksToShowInHistoryDialog),
        title: '<i class="fas fa-history"></i> History'
      };

      const dialogRef = this.historyDialog.open(HotKeysDialogComponent, dialogConfig);
      dialogRef.afterClosed().subscribe(
        data => {
          console.log('Dialog output:', data);
        }
      );
    }
  }
}
