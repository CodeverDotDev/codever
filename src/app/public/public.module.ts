import {NgModule} from '@angular/core';
import {SharedModule} from '../shared/shared.module';
import {AboutComponent} from './about/about.component';
import {TagService} from './tag/tag.service';
import {TagComponent} from './tag/tag.component';
import {PublicBookmarksRoutingModule} from './public-routing.module';
import {PublicCodingmarksComponent} from './codingmark/public-codingmarks.component';
import {PublicCodingmarksStore} from './codingmark/store/public-codingmarks-store.service';
import {MatTabsModule} from '@angular/material';
import {PublicCodingmarksService} from './codingmark/public-codingmarks.service';

@NgModule({
  declarations : [
    AboutComponent,
    PublicCodingmarksComponent,
    TagComponent
  ],
  imports: [
    SharedModule,
    PublicBookmarksRoutingModule,
    MatTabsModule
  ],
  providers: [
    PublicCodingmarksService,
    PublicCodingmarksStore,
    TagService
  ]
})
export class PublicBookmarksModule {}
