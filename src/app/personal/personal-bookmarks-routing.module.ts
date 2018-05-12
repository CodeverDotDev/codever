import {RouterModule, Routes} from '@angular/router';
import {PersonalBookmarksListComponent} from './personal-bookmarks-list.component';
import {NgModule} from '@angular/core';
import {PersonalBookmarksComponent} from './personal-bookmarks.component';
import {AuthGuard} from './auth-guard.service';
import {UpdatePersonalBookmarkComponent} from './update/update-personal-bookmark.component';
import {CreateNewPersonalBookmarkComponent} from './create/create-new-personal-bookmark.component';

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
        component: CreateNewPersonalBookmarkComponent
      },
      {
        path: 'bookmarks/:id',
        component: UpdatePersonalBookmarkComponent
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
