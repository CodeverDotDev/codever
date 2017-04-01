import {NgModule} from "@angular/core";
import {HttpModule} from "@angular/http";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {SharedModule} from "../shared/shared.module";
import {AboutComponent} from "./about/about.component";
import {BookmarksComponent} from "./bookmark/bookmarks.component";
import {BookmarkSearchComponent} from "./bookmark/search/bookmark-search.component";
import {BookmarkService} from "./bookmark/bookmark.service";
import {BookmarkSearchService} from "./bookmark/search/bookmark-search.service";
import {BookmarkStore} from "./bookmark/store/BookmarkStore";
import {AsyncPublicBookmarksListComponent} from "./bookmark/async-list/async-public-bookmark-list.component";
import {TagService} from "./tag/tag.service";
import {TagComponent} from "./tag/tag.component";

@NgModule({
  declarations : [
    AboutComponent,
    BookmarksComponent,
    BookmarkSearchComponent,
    AsyncPublicBookmarksListComponent,
    TagComponent
  ],
  imports: [
    SharedModule,
    CommonModule, //in the root module comes via the BrowserModule
    HttpModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [
    BookmarkService,
    BookmarkSearchService,
    BookmarkStore,
    TagService
  ]
})
export class PublicBookmarksModule {}
