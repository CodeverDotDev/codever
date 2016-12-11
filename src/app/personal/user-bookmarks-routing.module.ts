import {RouterModule} from "@angular/router";
import {UserBookmarksComponent} from "./user-bookmarks.component";
import {NgModule} from "@angular/core/src/metadata/ng_module";
import {BookmarkFormComponent} from "../bookmark/form/bookmark-form.component";

@NgModule({
  imports: [RouterModule.forChild([
    { path: '', component: UserBookmarksComponent },
    {
      path: 'new',
      component: BookmarkFormComponent
    }
  ])],
  exports: [RouterModule]
})
export class UserBookmarksRoutingModule {}
