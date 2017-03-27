import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {BookmarkFilterService} from "./filter.service";
import {Logger} from "./logger.service";

/**
 * Gather services and components that are reused by several modules, in a single CoreModule, that you import once when
 * the app starts and never import anywhere else.
 *
 * See more at - https://angular.io/docs/ts/latest/guide/ngmodule.html#!#core-module
 */
@NgModule({
  imports:      [ CommonModule ],
  providers:    [ BookmarkFilterService, Logger]
})
export class CoreModule {
}
