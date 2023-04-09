import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { PageNotFoundComponent } from './not-found.component';
import { SnippetNotFoundComponent } from './not-found/snippet-not-found.component';
import { NewEntryComponent } from './new-entry/new-entry.component';
import { AuthGuard } from './core/auth/auth-guard.service';

const routes: Routes = [
  {
    path: 'new-entry',
    canActivate: [AuthGuard],
    component: NewEntryComponent,
  },
  {
    path: 'my-bookmarks',
    loadChildren: () =>
      import('./my-bookmarks/my-bookmarks.module').then(
        (m) => m.MyBookmarksModule
      ),
  },
  {
    path: 'personal',
    redirectTo: 'my-bookmarks', // needed for already installed extension or bookmarklets
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./user/user-dashboard/user-dashboard.module').then(
        (m) => m.UserDashboardModule
      ),
  },
  {
    path: 'settings',
    loadChildren: () =>
      import('./user/user-settings/user-settings.module').then(
        (m) => m.UserSettingsModule
      ),
  },
  {
    path: 'public',
    loadChildren: () =>
      import('./public/public.module').then((m) => m.PublicResourcesModule),
  },
  {
    path: 'my-notes',
    loadChildren: () =>
      import('./my-notes/my-notes.module').then((m) => m.MyNotesModule),
  },
  {
    path: 'my-snippets',
    loadChildren: () =>
      import('./my-snippets/my-snippets.module').then(
        (m) => m.MySnippetsModule
      ),
  },
  {
    path: 'my-codelets',
    redirectTo: 'my-snippets', // needed for already installed extension or bookmarklets
  },
  {
    path: 'search',
    loadChildren: () =>
      import('./search-results/search-results.module').then(
        (m) => m.SearchResultsModule
      ),
  },
  {
    path: '',
    redirectTo: 'public',
    pathMatch: 'full',
  },
  { path: '404-snippet', component: SnippetNotFoundComponent },
  { path: '**', component: PageNotFoundComponent },
];

/**
 * See App routing @https://angular.io/docs/ts/latest/guide/ngmodule.html
 */
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
