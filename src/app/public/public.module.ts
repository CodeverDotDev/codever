import {NgModule} from '@angular/core';
import {SharedModule} from '../shared/shared.module';
import {AboutComponent} from './about/about.component';
import {TagService} from './tag/tag.service';
import {TagComponent} from './tag/tag.component';
import {PublicBookmarksRoutingModule} from './public-routing.module';
import {PublicBookmarksService} from './bookmark/public-bookmarks.service';
import {PublicBookmarksComponent} from './bookmark/public-bookmarks.component';
import {PublicBookmarksStore} from './bookmark/store/public-bookmarks.store';
import {MatTabsModule} from '@angular/material';

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
