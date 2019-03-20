import {NgModule} from '@angular/core';
import {SharedModule} from '../shared/shared.module';
import {AboutComponent} from './about/about.component';
import {TagService} from './tag/tag.service';
import {TagComponent} from './tag/tag.component';
import {PublicBookmarksRoutingModule} from './public-routing.module';
import {PublicBookmarksComponent} from './bookmarks/public-bookmarks.component';
import {PublicBookmarksStore} from './bookmarks/store/public-bookmarks-store.service';
import {MatTabsModule} from '@angular/material';
import {PublicBookmarksService} from './bookmarks/public-bookmarks.service';

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
    PublicBookmarksStore,
    TagService
  ]
})
export class PublicBookmarksModule {}
