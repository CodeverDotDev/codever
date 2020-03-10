import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { PageNotFoundComponent } from './not-found.component';

const routes: Routes = [
  {
    path: 'personal',
    loadChildren: () => import('app/personal/personal-bookmarks.module').then(m => m.PersonalBookmarksModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('app/user/dashboard/user-dashboard.module').then(m => m.UserDashboardModule)
  },
  {
    path: 'settings',
    loadChildren: () => import('app/user-settings/user-settings.module').then(m => m.UserSettingsModule)
  },
  {
    path: 'public',
    loadChildren: () => import('app/public/public.module').then(m => m.PublicBookmarksModule)
  },
  {
    path: '',
    redirectTo: 'public',
    pathMatch: 'full'
  },
  {path: '**', component: PageNotFoundComponent}
];


/**
 * See App routing @https://angular.io/docs/ts/latest/guide/ngmodule.html
 */
@NgModule({
  imports: [
    RouterModule.forRoot(
      routes
    )
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {
}

