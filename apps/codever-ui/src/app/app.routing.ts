import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { PageNotFoundComponent } from './not-found.component';
import { NoteNotFoundComponent } from './not-found/note-not-found.component';
import { NewEntryComponent } from './new-entry/new-entry.component';
import { AuthGuard } from './core/auth/auth-guard.service';
import { SearchRedirectGuard } from './core/search-redirect.guard';

const routes: Routes = [
  {
    path: 'new-entry',
    canActivate: [AuthGuard],
    component: NewEntryComponent,
  },
  {
    path: 'my-collections',
    loadChildren: () =>
      import('./my-collections/my-collections.module').then(
        (m) => m.MyCollectionsModule
      ),
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
    // Top-level public note URLs: /notes/:id/details and /notes/shared/:shareableId
    path: 'notes',
    loadChildren: () =>
      import('./public/notes/public-notes.module').then(
        (m) => m.PublicNotesModule
      ),
  },
  {
    // Phase 2 (intermediate): redirect public snippet URLs → notes (IDs are preserved by DB migration)
    path: 'snippets/:id/details',
    redirectTo: 'notes/:id/details',
  },
  {
    path: 'snippets/:id',
    redirectTo: 'notes/:id',
  },
  {
    // Phase 2 (intermediate): redirect all /my-snippets/** → /my-notes/**
    // (catches /my-snippets/new, /my-snippets/:id/details, etc.)
    path: 'my-snippets',
    redirectTo: 'my-notes',
    pathMatch: 'prefix',
  },
  {
    path: 'my-codelets',
    redirectTo: 'my-notes', // needed for already installed extension or bookmarklets
  },
  {
    path: 'search',
    canActivate: [SearchRedirectGuard],
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
  { path: '404-snippet', redirectTo: '404-note' },
  { path: '404-note', component: NoteNotFoundComponent },
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
