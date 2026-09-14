import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { BookmarksTaggedComponent } from './tag/bookmarks-tagged.component';
import { HomepageComponent } from './bookmarks/homepage.component';
import { PrivacyPolicyComponent } from './privacy/privacy-policy.component';
import { TermsOfServiceComponent } from './terms/terms-of-service.component';
import { UserPublicProfileComponent } from './user-public-profile/user-public-profile.component';
import { VersionComponent } from './version/version.component';
import { ExtensionsPageComponent } from './extensions/extensions-page.component';
import { AboutComponent } from './about/about.component';
import { RegisterComponent } from './register/register.component';
import { PublicBookmarkDetailsComponent } from './bookmarks/public-bookmark-details.component';
import { ShareableBookmarkDetailsComponent } from './bookmarks/shareable-bookmark-details/shareable-bookmark-details.component';

const publicRoutes: Routes = [
  {
    path: 'history',
    redirectTo: '/?tab=history',
    pathMatch: 'full',
  },
  {
    path: 'pinned',
    redirectTo: '/?tab=pinned',
    pathMatch: 'full',
  },
  {
    path: 'readlater',
    redirectTo: '/?tab=read-later',
    pathMatch: 'full',
  },
  {
    path: 'favorites',
    redirectTo: '/?tab=favorites',
    pathMatch: 'full',
  },
  {
    path: 'watched-tags',
    redirectTo: '/?tab=watched-tags',
    pathMatch: 'full',
  },
  {
    path: 'tagged/:tag',
    redirectTo: 'bookmarks/t/:tag',
  },
  {
    path: 'tags/:tag',
    redirectTo: 'bookmarks/t/:tag',
  },
  {
    path: 't/:tag',
    redirectTo: 'bookmarks/t/:tag',
  },
  {
    path: 'bookmarks/tagged/:tag',
    redirectTo: 'bookmarks/t/:tag',
  },
  {
    path: 'bookmarks/tags/:tag',
    redirectTo: 'bookmarks/t/:tag',
  },
  {
    path: 'bookmarks/t/:tag',
    component: BookmarksTaggedComponent,
  },
  {
    path: 'about',
    component: AboutComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'extensions',
    component: ExtensionsPageComponent,
  },
  {
    path: 'howto',
    loadChildren: () =>
      import('./howto/howto.module').then((m) => m.HowtoModule),
  },
  {
    path: 'bookmarklets',
    redirectTo: 'howto/bookmarklets',
  },
  {
    path: 'privacy-policy',
    component: PrivacyPolicyComponent,
  },
  {
    path: 'version',
    component: VersionComponent,
  },
  {
    path: 'terms-and-conditions',
    component: TermsOfServiceComponent,
  },
  {
    path: 'snippets',
    redirectTo: '/notes',
    // `pathMatch: 'full'` is required: these public routes are registered at the
    // ROOT level (PublicResourcesModule is imported eagerly in AppModule before
    // AppRoutingModule), so a default prefix match would hijack every
    // `/snippets/**` URL and shadow the more specific redirects below.
    pathMatch: 'full',
  },
  {
    path: 'snippets/tagged/:tag',
    redirectTo: 'snippets/t/:tag',
  },
  {
    path: 'snippets/tags/:tag',
    redirectTo: 'snippets/t/:tag',
  },
  {
    path: 'snippets/t/:tag',
    redirectTo: '/search?q=%5B:tag%5D&sd=public-notes',
  },
  {
    path: 'snippets/shared/:shareableId',
    redirectTo: '/notes/shared/:shareableId',
  },
  {
    // Redirect old /public/notes/:id URLs to the canonical /notes/:id/details.
    // `pathMatch: 'full'` is essential: without it the default prefix match also
    // matches the canonical `/notes/:id/details` URL (whose `notes/:id` prefix
    // matches this route) and redirects it back to itself, causing an NG04016
    // infinite redirect. These routes are registered at the root level, before
    // the lazy `notes` route, so they must not shadow canonical note URLs.
    // (A separate `notes/shared/:shareableId` redirect was removed for the same
    // reason — it redirected to itself; the canonical lazy `notes` route already
    // serves `/notes/shared/:shareableId`.)
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
      // This is a WILDCARD CATCH-ALL route that is scoped to the "/snippets/:snippetid"
      // route prefix. It will only catch non-matching routes that live
      // within this portion of the router tree.
      {
        path: '**',
        component: PublicBookmarkDetailsComponent,
      },
    ],
  },

  {
    path: 'users/:userId',
    component: UserPublicProfileComponent,
    children: [
      // This is a WILDCARD CATCH-ALL route that is scoped to the "/users/:userId"
      // route prefix. It will only catch non-matching routes that live
      // within this portion of the router tree.
      {
        path: '**',
        component: UserPublicProfileComponent,
      },
    ],
  },
  {
    path: '',
    component: HomepageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(publicRoutes)],
  exports: [RouterModule],
})
export class PublicRoutingModule {}
