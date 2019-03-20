import {NgModule} from '@angular/core';
import {SharedModule} from '../shared/shared.module';
import {AboutComponent} from './about/about.component';
import {TagService} from './tag/tag.service';
import {TagComponent} from './tag/tag.component';
import {PublicBookmarksRoutingModule} from './public-routing.module';
import {PublicBookmarksComponent} from './codingmark/public-bookmarks.component';
import {PublicCodingmarksStore} from './codingmark/store/public-bookmarks-store.service';
import {MatTabsModule} from '@angular/material';
import {PublicBookmarksService} from './codingmark/public-bookmarks.service';

@NgModule({
  declarations : [
    AboutComponent,
    PublicBookmarksComponent,
    TagComponent
  ],
  imports: [
    SharedModule,
    PublicBookmarksRoutingModule,
    MatTabsModule
  ],
  providers: [
    PublicBookmarksService,
    PublicCodingmarksStore,
    TagService
  ]
})
export class PublicBookmarksModule {}
