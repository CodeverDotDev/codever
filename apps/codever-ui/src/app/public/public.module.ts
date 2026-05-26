import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
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
import { MatTabsModule } from '@angular/material/tabs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { VersionComponent } from './version/version.component';
import { FeedbackService } from './feedback/feedback.service';
import { ExtensionsPageComponent } from './extensions/extensions-page.component';
import { AboutComponent } from './about/about.component';
import { RegisterComponent } from './register/register.component';
import { PublicBookmarkDetailsComponent } from './bookmarks/public-bookmark-details.component';
import { ShareableBookmarkDetailsComponent } from './bookmarks/shareable-bookmark-details/shareable-bookmark-details.component';

@NgModule({
  declarations: [
    AboutComponent,
    RegisterComponent,
    ExtensionsPageComponent,
    PrivacyPolicyComponent,
    TermsOfServiceComponent,
    HomepageComponent,
    UserPublicProfileComponent,
    BookmarksTaggedComponent,
    VersionComponent,
    PublicBookmarkDetailsComponent,
    ShareableBookmarkDetailsComponent,
  ],
  imports: [
    SharedModule,
    PublicRoutingModule,
    MatTabsModule,
    MatAutocompleteModule,
    MatSelectModule,
  ],
  providers: [
    PublicBookmarksService,
    PublicBookmarksStore,
    UserPublicService,
    BookmarksTaggedService,
    FeedbackService,
  ],
})
export class PublicResourcesModule {}
