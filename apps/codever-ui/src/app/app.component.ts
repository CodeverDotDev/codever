import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';

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
import { Observable, Subject, interval } from 'rxjs';
import { UserDataResource } from './core/model/user-data-resource.type';
import { Router } from '@angular/router';
import { environment } from '../environments/environment';
import { ScrollStrategy, ScrollStrategyOptions } from '@angular/cdk/overlay';
import { LoginDialogHelperService } from './core/login-dialog-helper.service';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent implements OnInit, OnDestroy {
  url = 'https://www.codever.dev';
  innerWidth: any;

  userIsLoggedIn = false;
  userId: string;

  userData$: Observable<UserData>;
  showWhatsNewNotification = false;
  readonly whatsNewNotificationKey =
    'whats-new-2026-06-snipptes_2_notes-my_collections-simplified_search';
  latestVisitedResources$: Observable<UserDataResource[]>;
  latestPinnedResources$: Observable<UserDataResource[]>;

  private readonly pinnedQuickAccessLimit = 15;

  favIcon: HTMLLinkElement = document.querySelector('#favicon');
  readonly environment = environment;

  scrollStrategy: ScrollStrategy;

  /** localStorage key used to coordinate the update prompt across open tabs. */
  private static readonly SW_UPDATE_STORAGE_KEY = 'codever-sw-update-offered';
  /** Hash of the latest deployed version reported by the service worker. */
  private latestVersionHash: string | null = null;
  /** Reference to the update toast currently shown in this tab, if any. */
  private updateToast: HTMLDivElement | null = null;
  /** True once the user has interacted (pointer/keyboard) with the page. */
  private userHasInteracted = false;
  /** Guards against triggering more than one silent reload. */
  private silentReloadInProgress = false;
  /** Emits on component teardown to unsubscribe long-lived streams. */
  private readonly destroy$ = new Subject<void>();

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
    private readonly scrollStrategyOptions: ScrollStrategyOptions,
    private readonly swUpdate: SwUpdate
  ) {
    this.innerWidth = 100;
  }

  ngOnInit(): void {
    this.listenForServiceWorkerUpdates();

    if (environment.production === false) {
      this.favIcon.href = 'assets/logo/logo-green.svg';
    }

    const isLoggedIn = this.keycloakService.isLoggedIn();
    if (isLoggedIn) {
      if (isLoggedIn) {
        this.userIsLoggedIn = true;
        this.userInfoStore.getUserInfoOidc$().subscribe((userInfo) => {
          this.userId = userInfo.sub;
          this.latestVisitedResources$ = this.userDataHistoryStore.getHistory$(
            this.userId,
            1
          );
          this.latestPinnedResources$ =
            this.userDataPinnedStore.getPinnedResources$(
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
    }
    this.scrollStrategy = this.scrollStrategyOptions.noop();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Keeps the app in sync with newly deployed versions and recovers from the
   * "stale chunk after deploy" problem.
   *
   * Background
   * ----------
   * Codever is a lazy-loaded SPA: each feature (notes, search, ...) is a separate
   * chunk with a content-hash filename that changes on every deploy. A browser
   * still running an older build references chunk names that the deploy removed,
   * so navigating to a not-yet-loaded route fails with `ChunkLoadError` (the
   * navigation appears to "stall"). Angular does not auto-swap versions
   * mid-session — the service worker deliberately keeps a running tab
   * version-consistent — so this must be handled explicitly.
   *
   * How updates are detected
   * ------------------------
   * The Angular service worker only checks for a new version at startup. To also
   * catch deploys during a long-lived session we poll with `checkForUpdate()`
   * roughly hourly (a cheap background fetch of `ngsw.json` that neither reloads
   * nor shows anything — it just feeds `versionUpdates`). `VERSION_READY` fires
   * only when the running build is behind the server, never on a fresh load that
   * is already current.
   *
   * How updates are applied (see `handleNewVersion`)
   * ------------------------------------------------
   * - Fresh start / idle tab (user has not interacted yet): the app was just
   *   loaded stale, so we `activateUpdate()` + reload SILENTLY — no dialog.
   * - Mid-session (user has interacted, may have unsaved input): we PROMPT
   *   instead, shown once in the visible tab and coordinated across tabs via
   *   `localStorage` so the user is never asked in multiple tabs.
   *
   * The `ChunkLoadErrorHandler` (registered globally in `app.module.ts`) remains
   * the last-resort safety net: if the user keeps working on a stale build and
   * hits a missing chunk before reloading, it reloads them onto the new build.
   */
  private listenForServiceWorkerUpdates(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.trackFirstUserInteraction();

    this.swUpdate.versionUpdates
      .pipe(
        filter(
          (event): event is VersionReadyEvent =>
            event.type === 'VERSION_READY'
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        this.latestVersionHash = event.latestVersion.hash;
        this.handleNewVersion();
      });

    // The SW only auto-checks at startup, so a tab kept open all day would never
    // notice a deploy on its own. Poll hourly to feed the flow above.
    interval(60 * 60 * 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.swUpdate.checkForUpdate());
  }

  /**
   * Records the first user interaction. This distinguishes a fresh start / idle
   * tab (no work at risk → safe to update silently) from an active session
   * (the user may have unsaved input → ask before reloading).
   */
  private trackFirstUserInteraction(): void {
    const mark = () => (this.userHasInteracted = true);
    const options: AddEventListenerOptions = { once: true, passive: true };
    window.addEventListener('pointerdown', mark, options);
    window.addEventListener('keydown', mark, options);
  }

  /**
   * Decides how to apply a newly detected version:
   * - **Not yet interacted** (fresh browser start or an idle tab): the app was
   *   effectively just loaded stale, so activate and reload **silently** — no
   *   dialog appears.
   * - **Mid-session** (user has interacted): **prompt** instead, coordinated
   *   across tabs, so we never reload out from under unsaved work.
   */
  private handleNewVersion(): void {
    if (!this.latestVersionHash) {
      return;
    }

    if (!this.userHasInteracted) {
      if (this.silentReloadInProgress) {
        return;
      }
      this.silentReloadInProgress = true;
      this.swUpdate.activateUpdate().then(() => document.location.reload());
      return;
    }

    this.maybePromptForNewVersion();
  }

  /**
   * Show the update prompt only in the currently visible tab, and only if no
   * other tab has already offered this exact version (coordinated via
   * localStorage). This ensures the user is asked once — in the tab they are
   * actually looking at — instead of once per open Codever tab.
   */
  private maybePromptForNewVersion(): void {
    if (
      !this.latestVersionHash ||
      this.updateToast ||
      !this.userHasInteracted
    ) {
      return;
    }
    // Another tab already offered this exact version — don't ask again here.
    if (
      localStorage.getItem(AppComponent.SW_UPDATE_STORAGE_KEY) ===
      this.latestVersionHash
    ) {
      return;
    }
    // Defer until this tab is focused so background tabs don't nag; it will be
    // re-evaluated on the next `visibilitychange`.
    if (document.visibilityState !== 'visible') {
      return;
    }
    this.promptForNewVersion(this.latestVersionHash);
  }

  /**
   * Shows a non-blocking toast letting the user reload to the newly deployed
   * version at their convenience.
   */
  private promptForNewVersion(versionHash: string): void {
    // Broadcast to other tabs that this version has been offered so they can
    // suppress (and hide) their own prompt — single ask across all tabs.
    localStorage.setItem(AppComponent.SW_UPDATE_STORAGE_KEY, versionHash);

    iziToast.show({
      title: 'New version available',
      message: 'Reload to get the latest version of Codever.',
      timeout: false,
      close: true,
      overlay: false,
      position: 'topRight',
      onOpening: (_instance, toast) => {
        this.updateToast = toast;
      },
      onClosing: () => {
        this.updateToast = null;
      },
      buttons: [
        [
          '<button><b>Reload</b></button>',
          (instance, toast) => {
            instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
            this.swUpdate
              .activateUpdate()
              .then(() => document.location.reload());
          },
          true,
        ],
        [
          '<button>Later</button>',
          (instance, toast) => {
            instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
          },
          false,
        ],
      ],
    });
  }

  /** Re-evaluate whether to prompt when this tab becomes visible/focused. */
  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    this.maybePromptForNewVersion();
  }

  /**
   * When another tab offers/handles the same version update, hide this tab's
   * prompt so the user is only asked once across all open Codever tabs.
   */
  @HostListener('window:storage', ['$event'])
  onCrossTabStorage(event: StorageEvent): void {
    if (
      event.key === AppComponent.SW_UPDATE_STORAGE_KEY &&
      event.newValue &&
      event.newValue === this.latestVersionHash &&
      this.updateToast
    ) {
      iziToast.hide({ transitionOut: 'fadeOut' }, this.updateToast);
      this.updateToast = null;
    }
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
      resources$:
        this.latestPinnedResources$ ||
        this.userDataPinnedStore.getPinnedResources$(this.userId, 1),
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
      resources$:
        this.latestVisitedResources$ ||
        this.userDataHistoryStore.getHistory$(this.userId, 1),
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
