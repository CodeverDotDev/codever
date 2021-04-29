import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { AboutComponent } from './about/about.component';
import { BookmarksTaggedService } from './tag/bookmarks-tagged.service';
import { BookmarksTaggedComponent } from './tag/bookmarks-tagged.component';
import { PublicRoutingModule } from './public-routing.module';
import { HomepageComponent } from './bookmarks/homepage.component';
import { PublicBookmarksStore } from './bookmarks/store/public-bookmarks-store.service';
import { PublicBookmarksService } from './bookmarks/public-bookmarks.service';
import { PrivacyPolicyComponent } from './privacy/privacy-policy.component';
import { TermsOfServiceComponent } from './terms/terms-of-service.component';
import { UserPublicProfileComponent } from './user-public-profile/user-public-profile.component';
import { UserPublicService } from './user-public-profile/user-public.service';
import { MySnippetsModule } from '../my-snippets/my-snippets.module';
import { MatTabsModule } from '@angular/material/tabs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { VersionComponent } from './version/version.component';
import { PublicSnippetsService } from './snippets/public-snippets.service';
import { PublicSnippetDetailsComponent } from './snippets/public-snippet-details.component';
import { PublicSnippetsComponent } from './public-snippets/public-snippets.component';
import { SnippetTaggedComponent } from './snippets/tag/snippet-tagged.component';
import { SnippetTagService } from './snippets/tag/snippet-tag.service';
import { FeedbackService } from './feedback/feedback.service';

@NgModule({
  declarations : [
    AboutComponent,
    PrivacyPolicyComponent,
    TermsOfServiceComponent,
    HomepageComponent,
    UserPublicProfileComponent,
    BookmarksTaggedComponent,
    VersionComponent,
    PublicSnippetDetailsComponent,
    PublicSnippetsComponent,
    SnippetTaggedComponent,
  ],
  imports: [
    SharedModule,
    PublicRoutingModule,
    MatTabsModule,
    MatAutocompleteModule,
    MatSelectModule,
    MySnippetsModule
  ],
  providers: [
    PublicBookmarksService,
    PublicSnippetsService,
    PublicBookmarksStore,
    UserPublicService,
    BookmarksTaggedService,
    SnippetTagService,
    FeedbackService
  ]
})
export class PublicResourcesModule {}
