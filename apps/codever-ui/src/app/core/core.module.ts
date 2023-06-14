import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Logger } from './logger.service';
import { ErrorService } from './error/error.service';
import { ErrorComponent } from './error/error.component';
import { RouterModule } from '@angular/router';
import { PersonalBookmarksService } from './personal-bookmarks.service';
import { UserDataService } from './user-data.service';
import { UserDataStore } from './user/userdata.store';
import { LoaderService } from './loader/loader.service';
import { KeycloakServiceWrapper } from './keycloak-service-wrapper.service';
import { UserInfoService } from './user/user-info.service';
import { UserInfoStore } from './user/user-info.store';
import { SuggestedTagsStore } from './user/suggested-tags.store';
import { MyBookmarksStore } from './user/my-bookmarks.store';
import { AdminService } from './admin/admin.service';
import { WebpageInfoService } from './webpage-info/webpage-info.service';
import { PaginationNotificationService } from './pagination-notification.service';
import { UserDataHistoryStore } from './user/userdata.history.store';
import { NotifyStoresService } from './user/notify-stores.service';
import { UserDataPinnedStore } from './user/userdata.pinned.store';
import { UserDataReadLaterStore } from './user/userdata.readlater.store';
import { UserDataFavoritesStore } from './user/userdata.favorites.store';
import { AuthGuard } from './auth/auth-guard.service';
import { FeedStore } from './user/feed-store.service';
import { PersonalSnippetsService } from './personal-snippets.service';
import { MarkdownService } from './markdown/markdown.service';
import { SearchNotificationService } from './search-notification.service';
import { StackoverflowHelper } from './helper/stackoverflow.helper';
import { LoginDialogHelperService } from './login-dialog-helper.service';
import { AddToHistoryService } from './user/add-to-history.service';
import { DialogMeasurementsHelper } from './helper/dialog-measurements.helper';
import { LocalStorageService } from './cache/local-storage.service';
import { HttpClientLocalStorageService } from './cache/http-client-local-storage.service';
import { SystemService } from './cache/system.service';
import { CookieService } from './cookies/cookie.service';
import { PersonalSearchService } from './personal-search.service';
import { PersonalNotesService } from './personal-notes.service';
import { DeleteNotificationService } from './notifications/delete-notification.service';
import { LatestSearchClickNotificationService } from './latest-search-click.notification.service';

/**
 * Gather services and components that are used by several modules, in a single CoreModule, that you import once when
 * the app starts and never import anywhere else.
 *
 * See more at - https://angular.io/docs/ts/latest/guide/ngmodule.html#!#core-module
 */
@NgModule({
  imports: [CommonModule, RouterModule],
  declarations: [ErrorComponent],
  exports: [ErrorComponent],
  providers: [
    Logger,
    ErrorService,
    AuthGuard,
    PersonalBookmarksService,
    PersonalSnippetsService,
    PersonalNotesService,
    PersonalSearchService,
    AdminService,
    UserDataService,
    UserDataStore,
    UserDataHistoryStore,
    UserDataPinnedStore,
    UserDataReadLaterStore,
    UserDataFavoritesStore,
    NotifyStoresService,
    MyBookmarksStore,
    UserInfoService,
    UserInfoStore,
    FeedStore,
    PaginationNotificationService,
    SuggestedTagsStore,
    WebpageInfoService,
    LoaderService,
    KeycloakServiceWrapper,
    MarkdownService,
    SearchNotificationService,
    StackoverflowHelper,
    DialogMeasurementsHelper,
    LoginDialogHelperService,
    AddToHistoryService,
    LocalStorageService,
    HttpClientLocalStorageService,
    SystemService,
    CookieService,
    DeleteNotificationService,
    LatestSearchClickNotificationService,
  ],
})
export class CoreModule {
  /**
   * Prevent reimport of the CoreModule - see https://angular.io/docs/ts/latest/guide/ngmodule.html#!#prevent-reimport
   * @param parentModule
   */
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error(
        'CoreModule is already loaded. Import it in the AppModule only'
      );
    }
  }
}
