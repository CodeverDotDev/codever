import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {TagComponent} from './tag/tag.component';
import {AboutComponent} from './about/about.component';
import {PublicBookmarksComponent} from './bookmark/public-bookmarks.component';

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
    component: PublicBookmarksComponent
  }
];
@NgModule({
  imports: [RouterModule.forChild(publicBookmarksRoutes)],
  exports: [RouterModule]
})
export class PublicBookmarksRoutingModule {}
