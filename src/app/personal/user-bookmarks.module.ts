import {NgModule} from "@angular/core";
import {UserBookmarksComponent} from "./user-bookmarks-home.component";
import {AsyncUserBookmarksListComponent} from "./async-list/async-personal-bookmark-list.component";
import {HttpModule} from "@angular/http";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {UserBookmarkStore} from "./store/UserBookmarkStore";
import {UserBookmarkService} from "./user-bookmark.service";
import {CommonModule} from "@angular/common";
import {UserBookmarksRoutingModule} from "./user-bookmarks-routing.module";
import {UserBookmarkFormComponent} from "./new-user-bookmark/new-user-bookmark-form.component";
import {BookmarkDetailComponent} from "./detail/bookmark-detail.component";
import {PersonalBookmarksComponent} from "./personal-bookmarks.component";
import {PersonalBookmarkSearchComponent} from "./search/personal-bookmark-search.component";
import {SharedModule} from "../shared/shared.module";
import {MarkdownService} from "./markdown.service";

export const routerConfig = [{
  path: '',
  component: UserBookmarksComponent
}];

@NgModule({
  declarations : [
    UserBookmarksComponent,
    UserBookmarkFormComponent,
    AsyncUserBookmarksListComponent,
    BookmarkDetailComponent,
    PersonalBookmarksComponent,
    PersonalBookmarkSearchComponent
  ],
  imports: [
    SharedModule,
    CommonModule, //in the root module comes via the BrowserModule
    HttpModule,
    FormsModule,
    ReactiveFormsModule,
    UserBookmarksRoutingModule
  ],
  providers: [
    UserBookmarkStore,
    UserBookmarkService,
    MarkdownService
  ]
})
export class UserBookmarksModule {}
