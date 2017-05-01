import {RouterModule, Routes} from '@angular/router';
import {AboutComponent} from './public/about/about.component';
import {BookmarksComponent} from './public/bookmark/bookmarks.component';
import {NgModule} from '@angular/core';
import {TagComponent} from './public/tag/tag.component';

const routes: Routes = [
  {
    path: 'search',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: '',
    component: BookmarksComponent
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
    path: 'personal',
    loadChildren: 'app/personal/personal-bookmarks.module#PersonalBookmarksModule'
  }
];

/**
 * See App routing @https://angular.io/docs/ts/latest/guide/ngmodule.html
 */
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}

