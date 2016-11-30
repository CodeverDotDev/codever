import {RouterModule} from "@angular/router";
import {UserBookmarksComponent} from "./user-bookmarks.component";
import {NgModule} from "@angular/core/src/metadata/ng_module";

@NgModule({
  imports: [RouterModule.forChild([
    { path: '', component: UserBookmarksComponent }
  ])],
  exports: [RouterModule]
})
export class UserBookmarksRoutingModule {}
