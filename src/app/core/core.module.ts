import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {BookmarkFilterService} from "./filter.service";
import {Logger} from "./logger.service";
import {KeycloakService} from "./keycloak/keycloak.service";
import {HttpWrapperService} from "./keycloak/http-wrapper.service";
import {ErrorService} from "./error/error.service";
import {ErrorComponent} from "./error/error.component";
import {NavigationComponent} from "./navigation/navigation.component";
import {RouterModule} from "@angular/router";

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
    KeycloakService,
    HttpWrapperService,
    ErrorService
  ]
})
export class CoreModule {
}
