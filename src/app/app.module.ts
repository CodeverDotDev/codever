import { NgModule, ApplicationRef } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {JsonpModule} from '@angular/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { ApiService } from './shared';
import { routing } from './app.routing';

import { removeNgStyles, createNewHosts } from '@angularclass/hmr';
import {BookmarkDetailComponent} from "./bookmark/detail/bookmark-detail.component";
import {BookmarksComponent} from "./bookmark/bookmarks.component";
import {BookmarkService} from "./bookmark/bookmark.service";
import {BookmarkSearchComponent} from "./bookmark/search/bookmark-search.component";

import './rxjs-extensions';
import {BookmarkFormComponent} from "./bookmark/form/bookmark-form.component";
import {AsyncBookmarksListComponent} from "./bookmark/async-list/async-bookmark-list.component";
import {BookmarkStore} from "./bookmark/store/BookmarkStore";
import {NavigationComponent} from "./navigation/navigation.component";
import {NavigationSearchComponent} from "./navigation/search/navigation-search.component";
import {NavbarSearchService} from "./navigation/search/NavbarSearchService";
import {SearchResultsComponent} from "./navigation/search/search-results.component";
import {BookmarkSearchService} from "./bookmark/search/bookmark-search.service";
import {Logger} from "./logger.service";
import {ErrorService} from "./error/error.service";
import {ErrorComponent} from "./error/error.component";

import {HttpModule, Http, XHRBackend, RequestOptions} from '@angular/http';
import {KeycloakService} from "./keycloak/keycloak.service";
import {KeycloakHttp} from "./keycloak/keycloak.http";

@NgModule({
  imports: [
    BrowserModule,
    HttpModule,
    FormsModule,
    ReactiveFormsModule,
    JsonpModule,
    routing
  ],
  declarations: [
    AppComponent,
    NavigationComponent,
    NavigationSearchComponent,
    HomeComponent,
    AboutComponent,
    BookmarkDetailComponent,
    BookmarksComponent,
    BookmarkSearchComponent,
    BookmarkFormComponent,
    AsyncBookmarksListComponent,
    SearchResultsComponent,
    ErrorComponent
  ],
  providers: [
    ApiService,
    BookmarkService,
    BookmarkSearchService,
    BookmarkStore,
    NavbarSearchService,
    Logger,
    ErrorService,
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
  bootstrap: [AppComponent]
})
export class AppModule {
  /*

  constructor(public appRef: ApplicationRef) {}
  hmrOnInit(store) {
    console.log('HMR store', store);
  }
  hmrOnDestroy(store) {
    let cmpLocation = this.appRef.components.map(cmp => cmp.location.nativeElement);
    // recreate elements
    store.disposeOldHosts = createNewHosts(cmpLocation);
    // remove styles
    removeNgStyles();
  }
  hmrAfterDestroy(store) {
    // display new elements
    store.disposeOldHosts();
    delete store.disposeOldHosts;
  }
  */
}
