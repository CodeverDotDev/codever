import { RouterModule, Routes, UrlSegment } from '@angular/router';
import {NgModule} from '@angular/core';
import {TagComponent} from './tag/tag.component';
import {AboutComponent} from './about/about.component';
import {HomepageComponent} from './bookmarks/homepage.component';
import {HowtoComponent} from './howto/howto.component';
import {PrivacyPolicyComponent} from './privacy/privacy-policy.component';
import {TermsOfServiceComponent} from './terms/terms-of-service.component';
import { UserPublicProfileComponent } from './user-public-profile/user-public-profile.component';

export function tagMatcher(url: UrlSegment[]) {
    return url.length === 1 && url[0].path !== 'personal' && url[0].path !== 'dashboard' && url[0].path !== 'settings' ? ({consumed: url}) : null;
}

const publicBookmarksRoutes: Routes = [
  {
    path: 'search',
    redirectTo: '',
    pathMatch: 'full'
  },
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
    path: 'about',
    component: AboutComponent
  },
  {
    path: 'howto',
    component: HowtoComponent
  },
  {
    path: 'privacy-policy',
    component: PrivacyPolicyComponent,
  },
  {
    path: 'terms-and-conditions',
    component: TermsOfServiceComponent,
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
  },
  { matcher: tagMatcher, component: TagComponent }
];

@NgModule({
  imports: [RouterModule.forChild(publicBookmarksRoutes)],
  exports: [RouterModule]
})
export class PublicBookmarksRoutingModule {}
