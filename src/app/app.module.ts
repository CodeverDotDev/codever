import {NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {JsonpModule, HttpModule} from "@angular/http";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {AppComponent} from "./app.component";
import {AboutComponent} from "./public/about/about.component";
import {AppRoutingModule} from "./app.routing";
import {BookmarksComponent} from "./bookmark/bookmarks.component";
import {BookmarkService} from "./bookmark/bookmark.service";
import {BookmarkSearchComponent} from "./bookmark/search/bookmark-search.component";
import "./rxjs-extensions";
import {BookmarkStore} from "./bookmark/store/BookmarkStore";
import {NavigationComponent} from "./navigation/navigation.component";
import {BookmarkSearchService} from "./bookmark/search/bookmark-search.service";
import {ErrorService} from "./error/error.service";
import {ErrorComponent} from "./error/error.component";
import {UserBookmarksModule} from "./personal/user-bookmarks.module";
import {AuthGuard} from "./auth-guard.service";
import {SharedModule} from "./shared/shared.module";
import {CoreModule} from "./core/core.module";

@NgModule({
  imports: [
    SharedModule,
    CoreModule,
    BrowserModule,
    HttpModule,
    FormsModule,
    ReactiveFormsModule,
    JsonpModule,
    UserBookmarksModule,
    AppRoutingModule
  ],
  declarations: [
    AppComponent,
    NavigationComponent,
    AboutComponent,
    BookmarksComponent,
    BookmarkSearchComponent,
    ErrorComponent
  ],
  providers: [
    AuthGuard,
    BookmarkService,
    BookmarkSearchService,
    BookmarkStore,
    ErrorService
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
