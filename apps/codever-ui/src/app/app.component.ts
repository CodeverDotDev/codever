import { Component, HostListener, OnInit } from '@angular/core';

import { UserDataHistoryStore } from './core/user/userdata.history.store';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { HotKeysDialogComponent } from './shared/dialog/history-dialog/hot-keys-dialog.component';
import { UserDataPinnedStore } from './core/user/userdata.pinned.store';
import { UserInfoStore } from './core/user/user-info.store';
import { KeycloakService } from 'keycloak-angular';
import { LoginRequiredDialogComponent } from './shared/dialog/login-required-dialog/login-required-dialog.component';
import iziToast, { IziToastSettings } from 'izitoast';
import { UserDataStore } from './core/user/userdata.store';
import { UserData } from './core/model/user-data';
import { Observable } from 'rxjs';
import { Bookmark } from './core/model/bookmark';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';
import { ScrollStrategy, ScrollStrategyOptions } from '@angular/cdk/overlay';
import { LoginDialogHelperService } from './core/login-dialog-helper.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  url = 'https://www.codever.dev';
  innerWidth: any;

  userIsLoggedIn = false;
  userId: string;

  userData$: Observable<UserData>;
  showWhatsNewNotification = false;
  readonly whatsNewNotificationKey =
    'whats-new-2026-06-snipptes_2_notes-my_collections-simplified_search';
  latestVisitedBookmarks$: Observable<Bookmark[]>;
  latestPinnedBookmarks$: Observable<Bookmark[]>;

  private readonly pinnedQuickAccessLimit = 15;

  favIcon: HTMLLinkElement = document.querySelector('#favicon');
  readonly environment = environment;

  scrollStrategy: ScrollStrategy;

  constructor(
    private keycloakService: KeycloakService,
    private userInfoStore: UserInfoStore,
    private userDataStore: UserDataStore,
    private userDataHistoryStore: UserDataHistoryStore,
    private userDataPinnedStore: UserDataPinnedStore,
    private historyDialog: MatDialog,
    private loginDialog: MatDialog,
    private loginDialogHelperService: LoginDialogHelperService,
    protected router: Router,
    private readonly scrollStrategyOptions: ScrollStrategyOptions
  ) {
    this.innerWidth = 100;
  }

  ngOnInit(): void {
    if (environment.production === false) {
      this.favIcon.href = 'assets/logo/logo-green.svg';
    }

    this.keycloakService.isLoggedIn().then((isLoggedIn) => {
      if (isLoggedIn) {
        this.userIsLoggedIn = true;
        this.userInfoStore.getUserInfoOidc$().subscribe((userInfo) => {
          this.userId = userInfo.sub;
          this.latestVisitedBookmarks$ = this.userDataHistoryStore.getHistory$(
            this.userId,
            1
          );
          this.latestPinnedBookmarks$ =
            this.userDataPinnedStore.getPinnedBookmarks$(
              this.userId,
              1,
              this.pinnedQuickAccessLimit
            );
        });
        this.userData$ = this.userDataStore.getUserData$();

        // Show "What's New" notification if not yet acknowledged by this user
        this.userData$.subscribe((userData) => {
          const acknowledged = userData.acknowledgedNotifications || [];
          if (!acknowledged.includes(this.whatsNewNotificationKey)) {
            this.showWhatsNewNotification = true;
          }
        });
      }
    });
    this.scrollStrategy = this.scrollStrategyOptions.noop();
  }

  @HostListener('window:keydown.control.p', ['$event'])
  showPinned(event: KeyboardEvent) {
    if (!this.userIsLoggedIn) {
      const dialogConfig = this.loginDialogHelperService.loginDialogConfig(
        'You need to be logged in to see the Pinned Bookmarks popup'
      );

      this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    } else {
      event.preventDefault();
      this.launchPinnedDialog();
    }
  }

  private launchPinnedDialog() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = true;
    dialogConfig.width = this.getRelativeWidth();
    dialogConfig.height = this.getRelativeHeight();
    dialogConfig.scrollStrategy = this.scrollStrategy;
    dialogConfig.data = {
      bookmarks$: this.userDataPinnedStore.getPinnedBookmarks$(this.userId, 1),
      title: '<i class="fas fa-thumbtack"></i> Pinned',
    };

    const dialogRef = this.historyDialog.open(
      HotKeysDialogComponent,
      dialogConfig
    );
    dialogRef.afterClosed().subscribe((data) => {
      console.log('Dialog output:', data);
    });
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
      const dialogConfig = this.loginDialogHelperService.loginDialogConfig(
        'You need to be logged in to see the History Bookmarks popup'
      );

      this.loginDialog.open(LoginRequiredDialogComponent, dialogConfig);
    } else {
      event.preventDefault();
      this.launchHistoryDialog();
    }
  }

  private launchHistoryDialog() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = true;
    dialogConfig.width = this.getRelativeWidth();
    dialogConfig.height = this.getRelativeHeight();
    dialogConfig.scrollStrategy = this.scrollStrategy;
    dialogConfig.data = {
      bookmarks$: this.userDataHistoryStore.getAllHistory$(this.userId),
      title: '<i class="fas fa-history"></i> History',
    };

    const dialogRef = this.historyDialog.open(
      HotKeysDialogComponent,
      dialogConfig
    );
    dialogRef.afterClosed().subscribe((data) => {
      console.log('Dialog output:', data);
    });
  }

  public acknowledgeWhatsNew() {
    this.userDataStore.acknowledgeNotification$(this.whatsNewNotificationKey);
    this.showWhatsNewNotification = false;

    const iziToastSettings: IziToastSettings = {
      title: 'Got it! Stay tuned for more updates.',
      timeout: 3000,
      position: 'topRight',
    };
    iziToast.success(iziToastSettings);
  }

  acknowledgeWelcomeMessage() {
    this.userDataStore.updateWelcomeAcknowledge$();
  }

  launchDialogFromQuickAccess(source: string) {
    if (source === 'last_visited') {
      this.launchHistoryDialog();
    }
    if (source === 'pinned') {
      this.launchPinnedDialog();
    }
  }
}
