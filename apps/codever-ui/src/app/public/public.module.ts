import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BookmarksTaggedService } from './tag/bookmarks-tagged.service';
import { BookmarksTaggedComponent } from './tag/bookmarks-tagged.component';
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
import { HomeTabsComponent } from './home-tabs/home-tabs.component';
import { homeRedirectGuard } from './home-tabs/home-redirect.guard';
import { FeedPageComponent } from './home-tabs/pages/feed-page.component';
import { HistoryPageComponent } from './home-tabs/pages/history-page.component';
import { PinnedPageComponent } from './home-tabs/pages/pinned-page.component';
import { ReadLaterPageComponent } from './home-tabs/pages/read-later-page.component';

const publicRoutes: Routes = [
  { path: 'readlater', redirectTo: '/read-later', pathMatch: 'full' },
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
    path: 'snippets/shared/:token',
    redirectTo: '/notes/shared/:token',
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
    path: 'bookmarks/shared/:token',
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
  {
    path: '',
    component: HomeTabsComponent,
    children: [
      { path: 'feed', component: FeedPageComponent },
      { path: 'history', component: HistoryPageComponent },
      { path: 'pinned', component: PinnedPageComponent },
      { path: 'read-later', component: ReadLaterPageComponent },
      {
        path: '',
        component: FeedPageComponent,
        pathMatch: 'full',
        canActivate: [homeRedirectGuard],
      },
    ],
  },
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
    HomeTabsComponent,
    FeedPageComponent,
    HistoryPageComponent,
    PinnedPageComponent,
    ReadLaterPageComponent,
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
