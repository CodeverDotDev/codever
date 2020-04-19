import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { PersonalBookmarksComponent } from './personal-bookmarks.component';
import { AuthGuard } from '../core/auth/auth-guard.service';
import { UpdatePersonalBookmarkComponent } from './update/update-personal-bookmark.component';
import { CreatePersonalBookmarkComponent } from './create/create-personal-bookmark.component';
import { CopyToMineBookmarkComponent } from './copy-to-mine/copy-to-mine-bookmark.component';

const personalBookmarksRoutes: Routes = [
  {
    path: '',
    component: PersonalBookmarksComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'new',
        component: CreatePersonalBookmarkComponent
      },
      {
        path: 'bookmarks/copy-to-mine',
        component: CopyToMineBookmarkComponent
      },
      {
        path: 'bookmarks/:id',
        component: UpdatePersonalBookmarkComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(personalBookmarksRoutes)],
  exports: [RouterModule]
})
export class PersonalBookmarksRoutingModule {
}
