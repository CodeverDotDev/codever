import {NgModule} from "@angular/core";
import {UserBookmarksComponent} from "./user-bookmarks.component";
import {AsyncUserBookmarksListComponent} from "./async-list/async-user-bookmark-list.component";
import {HttpModule} from "@angular/http";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {UserBookmarkStore} from "./store/UserBookmarkStore";
import {UserBookmarkService} from "./user-bookmark.service";

@NgModule({
  declarations : [
    UserBookmarksComponent,
    AsyncUserBookmarksListComponent
  ],
  imports: [
    HttpModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [
    UserBookmarkStore,
    UserBookmarkService
  ]
})
export class UserBookmarksModule {

}
