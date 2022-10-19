import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { UserTagsComponent } from './tags/user-tags.component';
import { UserDashboardComponent } from './user-dashboard.component';
import { CommonModule } from '@angular/common';
import { AuthGuard } from '../../core/auth/auth-guard.service';
import { UserBookmarksComponent } from './user-bookmarks/user-bookmarks.component';
import { SharedModule } from '../../shared/shared.module';
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
import { MySnippetsComponent } from './my-snippets/my-snippets.component';

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
        MySearchesComponent,
        FollowingComponent,
        FollowersComponent,
        MySearchesTemplateComponent,
        MySnippetsComponent
    ],
    imports: [
        RouterModule.forChild(userDashboardRoutes),
        SharedModule,
        MatTabsModule,
        MatAutocompleteModule,
        MatExpansionModule,
        MatDialogModule,
        CommonModule
    ],
    providers: [
        AuthGuard
    ],
    exports: [RouterModule]
})
export class UserDashboardModule {
}
