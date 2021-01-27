import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { TagComponent } from './tag/tag.component';
import { AboutComponent } from './about/about.component';
import { HomepageComponent } from './bookmarks/homepage.component';
import { PrivacyPolicyComponent } from './privacy/privacy-policy.component';
import { TermsOfServiceComponent } from './terms/terms-of-service.component';
import { UserPublicProfileComponent } from './user-public-profile/user-public-profile.component';
import { VersionComponent } from './version/version.component';
import { PublicSnippetDetailsComponent } from './snippets/public-snippet-details.component';
import { PublicSnippetsComponent } from './public-snippets/public-snippets.component';
import { SnippetTaggedComponent } from './snippets/tag/snippet-tagged.component';

const publicBookmarksRoutes: Routes = [
  {
    path: 'history',
    redirectTo: '/?tab=history',
    pathMatch: 'full'
  },
  {
    path: 'pinned',
    redirectTo: '/?tab=pinned',
    pathMatch: 'full'
  },
  {
    path: 'readlater',
    redirectTo: '/?tab=read-later',
    pathMatch: 'full'
  },
  {
    path: 'favorites',
    redirectTo: '/?tab=favorites',
    pathMatch: 'full'
  },
  {
    path: 'watched-tags',
    redirectTo: '/?tab=watched-tags',
    pathMatch: 'full'
  },
  {
    path: 'tagged/:tag',
    component: TagComponent
  },
  {
    path: 'tags/:tag',
    component: TagComponent
  },
  {
    path: 't/:tag',
    component: TagComponent
  },
  {
    path: 'about',
    component: AboutComponent
  },
  {
    path: 'howto',
    loadChildren: () => import('app/public/howto/howto.module').then(m => m.HowtoModule)
  },
  {
    path: 'bookmarklets',
    redirectTo: 'howto/bookmarklets'
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
    component: PublicSnippetsComponent,
  },
  {
    path: 'snippets/tagged/:tag',
    redirectTo: 'snippets/t/:tag'
  },
  {
    path: 'snippets/tags/:tag',
    redirectTo: 'snippets/t/:tag'
  },
  {
    path: 'snippets/t/:tag',
    component: SnippetTaggedComponent
  },
  {
    path: 'snippets/:id',
    component: PublicSnippetDetailsComponent,
    children: [
      // This is a WILDCARD CATCH-ALL route that is scoped to the "/snippets/:snippetid"
      // route prefix. It will only catch non-matching routes that live
      // within this portion of the router tree.
      {
        path: '**',
        component: PublicSnippetDetailsComponent
      }
    ]
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
        component: UserPublicProfileComponent
      }
    ]
  },
  {
    path: '',
    component: HomepageComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(publicBookmarksRoutes)],
  exports: [RouterModule]
})
export class PublicBookmarksRoutingModule {
}
