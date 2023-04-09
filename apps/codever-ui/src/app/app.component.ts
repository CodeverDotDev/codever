import { Component, HostListener, OnInit } from '@angular/core';

import '../styles.scss';
import { UserDataHistoryStore } from './core/user/userdata.history.store';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { HotKeysDialogComponent } from './shared/dialog/history-dialog/hot-keys-dialog.component';
import { UserDataPinnedStore } from './core/user/userdata.pinned.store';
import { UserInfoStore } from './core/user/user-info.store';
import { KeycloakService } from 'keycloak-angular';
import { LoginRequiredDialogComponent } from './shared/dialog/login-required-dialog/login-required-dialog.component';
import iziToast, { IziToastSettings } from 'izitoast';
import { Feedback } from './core/model/feedback';
import { CookieService } from './core/cookies/cookie.service';
import { FeedbackService } from './public/feedback/feedback.service';
import { UserDataStore } from './core/user/userdata.store';
import { Search, UserData } from './core/model/user-data';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Bookmark } from './core/model/bookmark';
import { Router } from '@angular/router';
import { AddToHistoryService } from './core/user/add-to-history.service';
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
  showAcknowledgeMigrationHeader = false;
  latestSearches$: Observable<Search[]>;
  latestVisitedBookmarks$: Observable<Bookmark[]>;

  private hoveringLastSearches: boolean[] = [];
  private hoveringLastVisited: boolean[] = [
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ];

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
    private cookieService: CookieService,
    private feedbackService: FeedbackService,
    protected router: Router,
    private addToHistoryService: AddToHistoryService,
    private readonly scrollStrategyOptions: ScrollStrategyOptions
  ) {
    this.innerWidth = 100;
  }

  ngOnInit(): void {
    if (environment.production === false) {
      this.favIcon.href = 'assets/logo/logo-green.svg';
    }
    const acknowledgedCodeverMigration = this.cookieService.readCookie(
      'acknowledge-codever-migration'
    );
    if (acknowledgedCodeverMigration !== 'true') {
      this.showAcknowledgeMigrationHeader = true;
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
        });
        this.userData$ = this.userDataStore.getUserData$();
        this.latestSearches$ = this.userData$.pipe(
          map((userData) => {
            for (let i = 0; i < 10; i++) {
              this.hoveringLastSearches.push(false);
            }
            return userData.searches.slice(0, 10);
          })
        );
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
      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = false;
      dialogConfig.autoFocus = true;
      dialogConfig.width = this.getRelativeWidth();
      dialogConfig.height = this.getRelativeHeight();
      dialogConfig.scrollStrategy = this.scrollStrategy;
      dialogConfig.data = {
        bookmarks$: this.userDataPinnedStore.getPinnedBookmarks$(
          this.userId,
          1
        ),
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
  }

  public acknowledgeCodeverRebranding(response: string) {
    this.cookieService.createCookie(
      'acknowledge-codever-migration',
      'true',
      365
    );
    this.showAcknowledgeMigrationHeader = false;

    const iziToastSettings: IziToastSettings = {
      title: 'Thank you for your feedback',
      timeout: 3000,
      position: 'topRight',
    };
    iziToast.success(iziToastSettings);

    const feedback: Feedback = {
      question: 'Bookmarks.dev rebranding to Codever',
      userResponse: response,
      userId: this.userId ? this.userId : null,
      userAgent: navigator.userAgent,
    };

    this.feedbackService.createFeedback(feedback).subscribe();
  }

  acknowledgeWelcomeMessage() {
    this.userDataStore.updateWelcomeAcknowledge$();
  }

  resetHoveringLastSearches() {
    this.hoveringLastSearches.forEach((item) => (item = false));
  }

  resetHoveringLastVisited() {
    this.hoveringLastVisited.forEach((item) => (item = false));
  }

  navigateToBookmarkDetails(bookmark: Bookmark): void {
    let link = [`./my-bookmarks/${bookmark._id}/details`];
    if (bookmark.public) {
      link = [`./bookmarks/${bookmark._id}/details`];
    }
    this.router.navigate(link, {
      state: { bookmark: bookmark },
    });
    this.addToHistoryService.promoteInHistoryIfLoggedIn(
      this.userIsLoggedIn,
      bookmark
    );
  }

  goToMainLink(bookmark: Bookmark) {
    this.addToHistoryService.promoteInHistoryIfLoggedIn(
      this.userIsLoggedIn,
      bookmark
    );
    window.open(bookmark.location, '_blank');
  }
}
