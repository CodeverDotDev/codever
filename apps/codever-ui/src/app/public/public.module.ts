import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BookmarksTaggedService } from './tag/bookmarks-tagged.service';
import { BookmarksTaggedComponent } from './tag/bookmarks-tagged.component';
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

const publicRoutes: Routes = [
  { path: 'history', redirectTo: '/?tab=history', pathMatch: 'full' },
  { path: 'pinned', redirectTo: '/?tab=pinned', pathMatch: 'full' },
  { path: 'readlater', redirectTo: '/?tab=read-later', pathMatch: 'full' },
  { path: 'favorites', redirectTo: '/?tab=favorites', pathMatch: 'full' },
  { path: 'watched-tags', redirectTo: '/?tab=watched-tags', pathMatch: 'full' },
  { path: 'tagged/:tag', redirectTo: 'bookmarks/t/:tag' },
  { path: 'tags/:tag', redirectTo: 'bookmarks/t/:tag' },
  { path: 't/:tag', redirectTo: 'bookmarks/t/:tag' },
  { path: 'bookmarks/tagged/:tag', redirectTo: 'bookmarks/t/:tag' },
  { path: 'bookmarks/tags/:tag', redirectTo: 'bookmarks/t/:tag' },
  { path: 'bookmarks/t/:tag', component: BookmarksTaggedComponent },
  { path: 'about', component: AboutComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'extensions', component: ExtensionsPageComponent },
  {
    path: 'howto',
    loadChildren: () =>
      import('./howto/howto.module').then((m) => m.HowtoModule),
  },
  { path: 'bookmarklets', redirectTo: 'howto/bookmarklets' },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: 'version', component: VersionComponent },
  { path: 'terms-and-conditions', component: TermsOfServiceComponent },
  { path: 'snippets', redirectTo: '/notes', pathMatch: 'full' },
  { path: 'snippets/tagged/:tag', redirectTo: 'snippets/t/:tag' },
  { path: 'snippets/tags/:tag', redirectTo: 'snippets/t/:tag' },
  {
    path: 'snippets/t/:tag',
    redirectTo: '/search?q=%5B:tag%5D&sd=public-notes',
  },
  {
    path: 'snippets/shared/:shareableId',
    redirectTo: '/notes/shared/:shareableId',
  },
  {
    path: 'notes/:id',
    redirectTo: '/notes/:id/details',
    pathMatch: 'full',
  },
  {
    path: 'snippets/:id',
    redirectTo: '/notes/:id/details',
    pathMatch: 'full',
  },
  {
    path: 'bookmarks/shared/:shareableId',
    component: ShareableBookmarkDetailsComponent,
  },
  {
    path: 'bookmarks/:id',
    component: PublicBookmarkDetailsComponent,
    children: [
      { path: '**', component: PublicBookmarkDetailsComponent },
    ],
  },
  {
    path: 'users/:userId',
    component: UserPublicProfileComponent,
    children: [{ path: '**', component: UserPublicProfileComponent }],
  },
  { path: '', component: HomepageComponent },
];

@NgModule({
  imports: [
    RouterModule.forChild(publicRoutes),
    MatTabsModule,
    MatAutocompleteModule,
    MatSelectModule,
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
  providers: [
    PublicBookmarksService,
    PublicBookmarksStore,
    UserPublicService,
    BookmarksTaggedService,
    FeedbackService,
  ],
})
export class PublicResourcesModule {}
