import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { AboutComponent } from './about/about.component';
import { TagService } from './tag/tag.service';
import { TagComponent } from './tag/tag.component';
import { PublicBookmarksRoutingModule } from './public-routing.module';
import { PublicBookmarksComponent } from './bookmarks/public-bookmarks.component';
import { PublicBookmarksStore } from './bookmarks/store/public-bookmarks-store.service';
import { MatAutocompleteModule, MatSelectModule, MatTabsModule } from '@angular/material';
import { PublicBookmarksService } from './bookmarks/public-bookmarks.service';
import { PublicBookmarkSearchComponent } from './search/public-bookmark-search.component';

@NgModule({
  declarations : [
    AboutComponent,
    PublicBookmarksComponent,
    PublicBookmarkSearchComponent,
    TagComponent
  ],
  imports: [
    SharedModule,
    PublicBookmarksRoutingModule,
    MatTabsModule,
    MatAutocompleteModule,
    MatSelectModule
  ],
  providers: [
    PublicBookmarksService,
    PublicBookmarksStore,
    TagService
  ]
})
export class PublicBookmarksModule {}
