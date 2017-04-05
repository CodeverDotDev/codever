import {RouterModule} from "@angular/router";
import {UserBookmarksComponent} from "./user-bookmarks-home.component";
import {NgModule} from "@angular/core/src/metadata/ng_module";
import {UserBookmarkFormComponent} from "./new-user-bookmark/new-user-bookmark-form.component";
import {BookmarkDetailComponent} from "./detail/bookmark-detail.component";
import {PersonalBookmarksComponent} from "./personal-bookmarks.component";
import {AuthGuard} from "../core/auth-guard.service";

@NgModule({
  imports: [RouterModule.forChild([
    {
      path: 'personal',
      component: PersonalBookmarksComponent,
      canActivate: [AuthGuard],
      children:[
        {
          path: '',
          component: UserBookmarksComponent
        },
        {
          path: 'new',
          component: UserBookmarkFormComponent
        },
        {
          path: 'bookmarks/:id',
          component: BookmarkDetailComponent
        }
      ]
    }

  ])],
  exports: [RouterModule]
})
export class UserBookmarksRoutingModule {}
