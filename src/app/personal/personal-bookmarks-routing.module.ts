import {RouterModule} from '@angular/router';
import {PersonalBookmarksListComponent} from './personal-bookmarks-list.component';
import {NgModule} from '@angular/core';
import {NewPersonalBookmarkFormComponent} from './new-personal-bookmark/new-personal-bookmark-form.component';
import {PersonalBookmarkDetailComponent} from './detail/personal-bookmark-detail.component';
import {PersonalBookmarksComponent} from './personal-bookmarks.component';
import {AuthGuard} from '../core/auth-guard.service';

@NgModule({
  imports: [RouterModule.forChild([
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
          path: '',
          component: PersonalBookmarksListComponent
        },
        {
          path: 'new',
          component: NewPersonalBookmarkFormComponent
        },
        {
          path: 'bookmarks/:id',
          component: PersonalBookmarkDetailComponent
        }
      ]
    }

  ])],
  exports: [RouterModule]
})
export class PersonalBookmarksRoutingModule {}
