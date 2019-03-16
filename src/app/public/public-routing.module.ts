import { RouterModule, Routes, UrlSegment } from '@angular/router';
import {NgModule} from '@angular/core';
import {TagComponent} from './tag/tag.component';
import {AboutComponent} from './about/about.component';
import {PublicCodingmarksComponent} from './codingmark/public-codingmarks.component';

export function tagMatcher(url: UrlSegment[]) {
    return url.length === 1 && url[0].path !== 'personal' ? ({consumed: url}) : null;
}

const publicBookmarksRoutes: Routes = [
  {
    path: 'search',
    redirectTo: '',
    pathMatch: 'full'
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
    path: '',
    component: PublicCodingmarksComponent
  },
  { matcher: tagMatcher, component: TagComponent }
];

@NgModule({
  imports: [RouterModule.forChild(publicBookmarksRoutes)],
  exports: [RouterModule]
})
export class PublicBookmarksRoutingModule {}
