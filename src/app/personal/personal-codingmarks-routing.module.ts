import {RouterModule, Routes} from '@angular/router';
import {PersonalCodingmarksListComponent} from './personal-codingmarks-list.component';
import {NgModule} from '@angular/core';
import {PersonalCodingmarksComponent} from './personal-codingmarks.component';
import {AuthGuard} from './auth-guard.service';
import {UpdatePersonalBookmarkComponent} from './update/update-personal-bookmark.component';
import {CreatePersonalCodingmarkComponent} from './create/create-personal-codingmark.component';

const personalBookmarksRoutes: Routes = [
  {
    path: '',
    component: PersonalCodingmarksComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'search',
        redirectTo: '',
        pathMatch: 'full'
      },
      {
        path: 'new',
        component: CreatePersonalCodingmarkComponent
      },
      {
        path: 'bookmarks/:id',
        component: UpdatePersonalBookmarkComponent
      },
      {
        path: '',
        component: PersonalCodingmarksListComponent
      }
    ]
  }
];
@NgModule({
  imports: [RouterModule.forChild(personalBookmarksRoutes)],
  exports: [RouterModule]
})
export class PersonalCodingmarksRoutingModule {}
