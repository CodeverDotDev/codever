import {NgModule} from '@angular/core';
import {HttpModule} from '@angular/http';
import {ReactiveFormsModule} from '@angular/forms';
import {SharedModule} from '../shared/shared.module';
import {AboutComponent} from './about/about.component';
import {BookmarkSearchComponent} from './bookmark/search/bookmark-search.component';
import {BookmarkSearchService} from './bookmark/search/bookmark-search.service';
import {BookmarkStore} from './bookmark/store/BookmarkStore';
import {TagService} from './tag/tag.service';
import {TagComponent} from './tag/tag.component';
import {PublicBookmarksRoutingModule} from './public-routing.module';
import {PublicBookmarksService} from './bookmark/public-bookmarks.service';
import {PublicBookmarksComponent} from './bookmark/public-bookmarks.component';

@NgModule({
  declarations : [
    AboutComponent,
    PublicBookmarksComponent,
    BookmarkSearchComponent,
    TagComponent
  ],
  imports: [
    SharedModule,
    ReactiveFormsModule,
    PublicBookmarksRoutingModule
  ],
  providers: [
    PublicBookmarksService,
    BookmarkSearchService,
    BookmarkStore,
    TagService
  ]
})
export class PublicBookmarksModule {}
