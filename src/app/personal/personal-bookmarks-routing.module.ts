import {RouterModule, Routes} from '@angular/router';
import {PersonalBookmarksListComponent} from './personal-bookmarks-list.component';
import {NgModule} from '@angular/core';
import {PersonalBookmarksComponent} from './personal-bookmarks.component';
import {AuthGuard} from './auth-guard.service';
import {UpdatePersonalCodingmarkComponent} from './update/update-personal-codingmark.component';
import {CreatePersonalBookmarkComponent} from './create/create-personal-bookmark.component';

const personalBookmarksRoutes: Routes = [
  {
    path: '',
    component: PersonalBookmarksComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'search',
        redirectTo: '',
        pathMatch: 'full'
      },
      {
        path: 'new',
        component: CreatePersonalBookmarkComponent
      },
      {
        path: 'bookmarks/:id',
        component: UpdatePersonalCodingmarkComponent
      },
      {
        path: '',
        component: PersonalBookmarksListComponent
      }
    ]
  }
];
@NgModule({
  imports: [RouterModule.forChild(personalBookmarksRoutes)],
  exports: [RouterModule]
})
export class PersonalBookmarksRoutingModule {}
