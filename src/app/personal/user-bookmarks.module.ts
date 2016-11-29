import {NgModule} from "@angular/core";
import {UserBookmarksComponent} from "./user-bookmarks.component";
import {AsyncUserBookmarksListComponent} from "./async-list/async-user-bookmark-list.component";
import {HttpModule} from "@angular/http";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {UserBookmarkStore} from "./store/UserBookmarkStore";
import {UserBookmarkService} from "./user-bookmark.service";
import {CommonModule} from "@angular/common";

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
  ],
  providers: [
    UserBookmarkStore,
    UserBookmarkService
  ],
  exports: [
    UserBookmarksComponent,
    AsyncUserBookmarksListComponent
  ]
})
export class UserBookmarksModule {

}
