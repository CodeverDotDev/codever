import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {BookmarkFilterService} from "./filter.service";
import {Logger} from "./logger.service";
import {KeycloakService} from "./keycloak/keycloak.service";
import {HttpWrapperService} from "./keycloak/http-wrapper.service";

/**
 * Gather services and components that are used by several modules, in a single CoreModule, that you import once when
 * the app starts and never import anywhere else.
 *
 * See more at - https://angular.io/docs/ts/latest/guide/ngmodule.html#!#core-module
 */
@NgModule({
  imports:      [ CommonModule ],
  providers: [
    BookmarkFilterService,
    Logger,
    KeycloakService,
    HttpWrapperService
  ]
})
export class CoreModule {
}
