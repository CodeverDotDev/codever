import {RouterModule} from "@angular/router";
import {UserBookmarksComponent} from "./user-bookmarks.component";
import {NgModule} from "@angular/core/src/metadata/ng_module";
import {UserBookmarkFormComponent} from "./new-user-bookmark/new-user-bookmark-form.component";

@NgModule({
  imports: [RouterModule.forChild([
    { path: '', component: UserBookmarksComponent },
    {
      path: 'new',
      component: UserBookmarkFormComponent
    }
  ])],
  exports: [RouterModule]
})
export class UserBookmarksRoutingModule {}
