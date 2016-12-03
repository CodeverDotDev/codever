import {NgModule} from "@angular/core";
import {UserBookmarksComponent} from "./user-bookmarks.component";
import {AsyncUserBookmarksListComponent} from "./async-list/async-user-bookmark-list.component";
import {HttpModule, Http, XHRBackend, RequestOptions} from "@angular/http";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {UserBookmarkStore} from "./store/UserBookmarkStore";
import {UserBookmarkService} from "./user-bookmark.service";
import {CommonModule} from "@angular/common";
import {UserBookmarksRoutingModule} from "./user-bookmarks-routing.module";
import {KeycloakService} from "../keycloak/keycloak.service";
import {KeycloakHttp} from "../keycloak/keycloak.http";

export const routerConfig = [{
  path: '',
  component: UserBookmarksComponent
}];

@NgModule({
  declarations : [
    UserBookmarksComponent,
    AsyncUserBookmarksListComponent
  ],
  imports: [
    CommonModule, //in the root module comes via the BrowserModule
    HttpModule,
    FormsModule,
    ReactiveFormsModule,
    UserBookmarksRoutingModule
    //RouterModule.forChild(routerConfig)
  ],
  providers: [
    UserBookmarkStore,
    UserBookmarkService,
    KeycloakService,
    {
      provide: Http,
      useFactory:
          (
              backend: XHRBackend,
              defaultOptions: RequestOptions,
              keycloakService: KeycloakService
          ) => new KeycloakHttp(backend, defaultOptions, keycloakService),
      deps: [XHRBackend, RequestOptions, KeycloakService]
    }
  ],
  exports: [
    UserBookmarksComponent,
    AsyncUserBookmarksListComponent
  ]
})
export class UserBookmarksModule {

  // I initialize the module.
  constructor() {

    console.log( "UserBookmarksModule Constructor." );
    KeycloakService.init()
      .then(() => {
        console.log("***** Keycloak correctly initialized ******");
      })
      .catch(() => window.location.reload());
    console.groupEnd();

  }

}
