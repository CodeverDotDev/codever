import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookmarkFilterService } from './filter.service';
import { Logger } from './logger.service';
import { ErrorService } from './error/error.service';
import { ErrorComponent } from './error/error.component';
import { NavigationComponent } from './navigation/navigation.component';
import { RouterModule } from '@angular/router';
import { PersonalBookmarksStore } from './store/personal-bookmarks-store.service';
import { PersonalBookmarksService } from './personal-bookmarks.service';
import { UserDataService } from './user-data.service';
import { UserDataStore } from './user/userdata.store';
import { LoaderService } from './loader/loader.service';
import { KeycloakServiceWrapper } from './keycloak-service-wrapper.service';


/**
 * Gather services and components that are used by several modules, in a single CoreModule, that you import once when
 * the app starts and never import anywhere else.
 *
 * See more at - https://angular.io/docs/ts/latest/guide/ngmodule.html#!#core-module
 */
@NgModule({
  imports: [
    CommonModule,
    RouterModule
  ],
  declarations: [
    NavigationComponent,
    ErrorComponent
  ],
  exports: [
    NavigationComponent,
    ErrorComponent
  ],
  providers: [
    BookmarkFilterService,
    Logger,
    ErrorService,
    PersonalBookmarksStore,
    PersonalBookmarksService,
    UserDataService,
    UserDataStore,
    LoaderService,
    KeycloakServiceWrapper
  ]
})
export class CoreModule {
  /**
   * Prevent reimport of the CoreModule - see https://angular.io/docs/ts/latest/guide/ngmodule.html#!#prevent-reimport
   * @param parentModule
   */
  constructor (@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error(
        'CoreModule is already loaded. Import it in the AppModule only');
    }
  }
}
