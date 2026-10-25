import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { UserTagsComponent } from './tags/user-tags.component';
import { UserDashboardComponent } from './user-dashboard.component';
import { CommonModule } from '@angular/common';
import { AuthGuard } from '../../core/auth/auth-guard.service';
import { UserBookmarksComponent } from './user-bookmarks/user-bookmarks.component';

import { DeleteBookmarksByTagDialogComponent } from './tags/delete-bookmarks-by-tag-dialog/delete-bookmarks-by-tag-dialog.component';
import { DeleteSavedSearchDialogComponent } from './my-searches/delete-saved-search-dialog/delete-saved-search-dialog.component';
import { MySearchesComponent } from './my-searches/my-searches.component';
import { FollowingComponent } from './following/following.component';
import { FollowersComponent } from './followers/followers.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule } from '@angular/material/dialog';
import { MySearchesTemplateComponent } from './my-searches/my-searches-template/my-searches-template.component';
import { MyNotesComponent } from './my-notes/my-notes.component';
import { SharedByMeComponent } from './shared-by-me/shared-by-me.component';
import { PersonalNotesService } from '../../core/personal-notes.service';
import { PaginationNotificationService } from '../../core/pagination-notification.service';

import { StopSharingDialogComponent } from '../../shared/dialog/stop-sharing-dialog/stop-sharing-dialog.component';
import { DashboardSectionPageComponent } from './dashboard-section-page.component';

export const userDashboardRoutes: Routes = [
  {
    path: '',
    component: UserDashboardComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'bookmarks',
    component: DashboardSectionPageComponent,
    data: { section: 'bookmarks' },
    canActivate: [AuthGuard],
  },
  {
    path: 'notes',
    component: DashboardSectionPageComponent,
    data: { section: 'notes' },
    canActivate: [AuthGuard],
  },
  {
    path: 'tags',
    component: DashboardSectionPageComponent,
    data: { section: 'tags' },
    canActivate: [AuthGuard],
  },
  {
    path: 'searches',
    component: DashboardSectionPageComponent,
    data: { section: 'searches' },
    canActivate: [AuthGuard],
  },
  {
    path: 'following',
    component: DashboardSectionPageComponent,
    data: { section: 'following' },
    canActivate: [AuthGuard],
  },
  {
    path: 'followers',
    component: DashboardSectionPageComponent,
    data: { section: 'followers' },
    canActivate: [AuthGuard],
  },
  {
    path: 'shared',
    component: DashboardSectionPageComponent,
    data: { section: 'shared' },
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [
    RouterModule.forChild(userDashboardRoutes),
    MatTabsModule,
    MatAutocompleteModule,
    MatExpansionModule,
    MatDialogModule,
    CommonModule,
    UserTagsComponent,
    UserDashboardComponent,
    DashboardSectionPageComponent,
    UserBookmarksComponent,
    DeleteBookmarksByTagDialogComponent,
    DeleteSavedSearchDialogComponent,
    StopSharingDialogComponent,
    MySearchesComponent,
    FollowingComponent,
    FollowersComponent,
    MySearchesTemplateComponent,
    MyNotesComponent,
    SharedByMeComponent,
  ],
  providers: [AuthGuard, PersonalNotesService, PaginationNotificationService],
  exports: [RouterModule],
})
export class UserDashboardModule {}
