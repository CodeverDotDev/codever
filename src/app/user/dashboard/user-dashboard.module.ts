import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { UserTagsComponent } from './tags/user-tags.component';
import { UserDashboardComponent } from './user-dashboard.component';
import { MatAutocompleteModule, MatDialogModule, MatTabsModule } from '@angular/material';
import { CommonModule } from '@angular/common';
import { AuthGuard } from '../../core/auth/auth-guard.service';
import { UserBookmarksComponent } from './user-bookmarks/user-bookmarks.component';
import { SharedModule } from '../../shared/shared.module';
import { DeleteBookmarksByTagDialogComponent } from './tags/delete-bookmarks-by-tag-dialog/delete-bookmarks-by-tag-dialog.component';
import { DeleteSavedSearchDialogComponent } from './saved-searches/delete-saved-search-dialog/delete-saved-search-dialog.component';
import { SavedSearchesComponent } from './saved-searches/saved-searches.component';
import { FollowingComponent } from './following/following.component';
import { FollowersComponent } from './followers/followers.component';

const userDashboardRoutes: Routes = [
  {
    path: 'tags',
    redirectTo: '/dashboard?tab=tags',
    pathMatch: 'full'
  },
  {

    path: '',
    component: UserDashboardComponent,
    canActivate: [AuthGuard],
  }
];

@NgModule({
  declarations: [
    UserTagsComponent,
    UserDashboardComponent,
    UserBookmarksComponent,
    DeleteBookmarksByTagDialogComponent,
    DeleteSavedSearchDialogComponent,
    SavedSearchesComponent,
    FollowingComponent,
    FollowersComponent
  ],
  imports: [
    RouterModule.forChild(userDashboardRoutes),
    SharedModule,
    MatTabsModule,
    MatAutocompleteModule,
    MatDialogModule,
    CommonModule
  ],
  providers: [
    AuthGuard
  ],
  entryComponents: [
    DeleteBookmarksByTagDialogComponent,
    DeleteSavedSearchDialogComponent
  ],
  exports: [RouterModule]
})
export class UserDashboardModule {
}
