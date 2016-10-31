import { NgModule, ApplicationRef } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {HttpModule, JsonpModule} from '@angular/http';
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
import {BookmarkSearchFormControlComponent} from "./bookmark/search/formControl/bookmark-search-formControl.component";
import {AsyncBookmarksListComponent} from "./bookmark/async-list/async-bookmark-list.component";

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
    HomeComponent,
    AboutComponent,
    BookmarkDetailComponent,
    BookmarksComponent,
    BookmarkSearchComponent,
    BookmarkSearchFormControlComponent,
    BookmarkFormComponent,
    AsyncBookmarksListComponent
  ],
  providers: [
    ApiService,
    BookmarkService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
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
}
