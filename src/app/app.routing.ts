import {RouterModule, Routes} from "@angular/router";
import {AboutComponent} from "./public/about/about.component";
import {BookmarksComponent} from "./public/bookmark/bookmarks.component";
import {NgModule} from "@angular/core/src/metadata/ng_module";

const routes: Routes = [
  {
    path: '',
    component: BookmarksComponent
  },
  {
    path: 'about',
    component: AboutComponent
  }
];

/**
 * See App routing @https://angular.io/docs/ts/latest/guide/ngmodule.html
 */
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}

