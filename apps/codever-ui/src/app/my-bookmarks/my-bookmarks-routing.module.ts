import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { MyBookmarksEntryPointComponent } from './my-bookmarks-entry-point.component';
import { AuthGuard } from '../core/auth/auth-guard.service';
import { UpdatePersonalBookmarkComponent } from './update/update-personal-bookmark.component';
import { CreatePersonalBookmarkComponent } from './create/create-personal-bookmark.component';
import { CopyToMineBookmarkComponent } from './copy-to-mine/copy-to-mine-bookmark.component';
import { BookmarkDetailsComponent } from './bookmark-details/bookmark-details.component';

const myBookmarksRoutes: Routes = [
  {
    path: '',
    component: MyBookmarksEntryPointComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'new',
        component: CreatePersonalBookmarkComponent,
      },
      {
        path: ':id/copy-to-mine',
        component: CopyToMineBookmarkComponent,
      },
      {
        path: ':id/details',
        component: BookmarkDetailsComponent,
      },
      {
        path: ':id/edit',
        component: UpdatePersonalBookmarkComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(myBookmarksRoutes)],
  exports: [RouterModule],
})
export class MyBookmarksRoutingModule {}
