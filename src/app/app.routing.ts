import {RouterModule, Routes} from "@angular/router";
import {AboutComponent} from "./public/about/about.component";
import {BookmarksComponent} from "./bookmark/bookmarks.component";

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

export const routing = RouterModule.forRoot(routes);
