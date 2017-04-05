import {NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {JsonpModule, HttpModule} from "@angular/http";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {AppComponent} from "./app.component";
import {AppRoutingModule} from "./app.routing";
import "./rxjs-extensions";
import {UserBookmarksModule} from "./personal/user-bookmarks.module";
import {SharedModule} from "./shared/shared.module";
import {CoreModule} from "./core/core.module";
import {PublicBookmarksModule} from "./public/public.module";

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
    PublicBookmarksModule,
    AppRoutingModule
  ],
  declarations: [
    AppComponent
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
