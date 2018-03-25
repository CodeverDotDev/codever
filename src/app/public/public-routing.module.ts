import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {BookmarksComponent} from './bookmark/bookmarks.component';
import {TagComponent} from './tag/tag.component';
import {AboutComponent} from './about/about.component';

const publicBookmarksRoutes: Routes = [
  {
    path: 'search',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: 'tagged/:tag',
    component: TagComponent
  },
  {
    path: 'about',
    component: AboutComponent
  },
  {
    path: '',
    component: BookmarksComponent
  }
];
@NgModule({
  imports: [RouterModule.forChild(publicBookmarksRoutes)],
  exports: [RouterModule]
})
export class PublicBookmarksRoutingModule {}
