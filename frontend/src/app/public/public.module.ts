import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { AboutComponent } from './about/about.component';
import { TagService } from './tag/tag.service';
import { TagComponent } from './tag/tag.component';
import { PublicBookmarksRoutingModule } from './public-routing.module';
import { HomepageComponent } from './bookmarks/homepage.component';
import { PublicBookmarksStore } from './bookmarks/store/public-bookmarks-store.service';
import { PublicBookmarksService } from './bookmarks/public-bookmarks.service';
import { PrivacyPolicyComponent } from './privacy/privacy-policy.component';
import { TermsOfServiceComponent } from './terms/terms-of-service.component';
import { UserPublicProfileComponent } from './user-public-profile/user-public-profile.component';
import { UserPublicService } from './user-public-profile/user-public.service';
import { CodeletModule } from '../codelet/codelet.module';
import { MatTabsModule } from '@angular/material/tabs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { VersionComponent } from './version/version.component';
import { PublicSnippetsService } from './snippets/public-snippets.service';
import { PublicSnippetDetailsComponent } from './snippets/public-snippet-details.component';
import { PublicSnippetsComponent } from './public-snippets/public-snippets.component';
import { SnippetTaggedComponent } from './snippets/tag/snippet-tagged.component';
import { SnippetTagService } from './snippets/tag/snippet-tag.service';

@NgModule({
  declarations : [
    AboutComponent,
    PrivacyPolicyComponent,
    TermsOfServiceComponent,
    HomepageComponent,
    UserPublicProfileComponent,
    TagComponent,
    VersionComponent,
    PublicSnippetDetailsComponent,
    PublicSnippetsComponent,
    SnippetTaggedComponent,
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
    PublicSnippetsService,
    PublicBookmarksStore,
    UserPublicService,
    TagService,
    SnippetTagService
  ]
})
export class PublicBookmarksModule {}
