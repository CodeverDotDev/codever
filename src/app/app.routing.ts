import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';

const routes: Routes = [
  {
    path: 'public',
    loadChildren: 'app/public/public.module#PublicBookmarksModule'
  },
    {
    path: 'personal',
    loadChildren: 'app/personal/personal-bookmarks.module#PersonalBookmarksModule'
  },
  {
    path: '',
    redirectTo: 'public',
    pathMatch: 'full'
  }
];

/**
 * See App routing @https://angular.io/docs/ts/latest/guide/ngmodule.html
 */
@NgModule({
  imports: [
    RouterModule.forRoot(
      routes,
      { enableTracing: true } // <-- debugging purposes only
    )
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}

