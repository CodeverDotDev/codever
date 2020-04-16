import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { AboutComponent } from './about/about.component';
import { TagService } from './tag/tag.service';
import { TagComponent } from './tag/tag.component';
import { PublicBookmarksRoutingModule } from './public-routing.module';
import { HomepageComponent } from './bookmarks/homepage.component';
import { PublicBookmarksStore } from './bookmarks/store/public-bookmarks-store.service';
import { MatAutocompleteModule, MatSelectModule, MatTabsModule } from '@angular/material';
import { PublicBookmarksService } from './bookmarks/public-bookmarks.service';
import { BookmarksSearchComponent } from './search/bookmarks-search.component';
import { HowtoComponent } from './howto/howto.component';
import { PrivacyPolicyComponent } from './privacy/privacy-policy.component';
import { TermsOfServiceComponent } from './terms/terms-of-service.component';
import { UserPublicProfileComponent } from './user-public-profile/user-public-profile.component';
import { UserPublicService } from './user-public-profile/user-public.service';
import { CodeletModule } from '../codelet/codelet.module';
import { BookmarkletComponent } from './bookmarklets/bookmarklet.component';

@NgModule({
  declarations : [
    AboutComponent,
    BookmarkletComponent,
    HowtoComponent,
    PrivacyPolicyComponent,
    TermsOfServiceComponent,
    HomepageComponent,
    BookmarksSearchComponent,
    UserPublicProfileComponent,
    TagComponent
  ],
  imports: [
    SharedModule,
    PublicBookmarksRoutingModule,
    MatTabsModule,
    MatAutocompleteModule,
    MatSelectModule,
    CodeletModule
  ],
  providers: [
    PublicBookmarksService,
    PublicBookmarksStore,
    UserPublicService,
    TagService
  ]
})
export class PublicBookmarksModule {}
