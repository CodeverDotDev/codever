import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import {BookmarksComponent} from "./bookmark/bookmarks.component";
import {BookmarkDetailComponent} from "./bookmark/bookmark-detail.component";
import {BookmarkFormComponent} from "./bookmark/form/bookmark-form.component";

const routes: Routes = [
  { path: '', component: BookmarksComponent },
  { path: 'about', component: AboutComponent},
  //{ path: 'bookmarks', component: BookmarksComponent},
  { path: 'new', component: BookmarkFormComponent},
  {
    path: 'bookmarks/:id',
    component: BookmarkDetailComponent
  },
];

export const routing = RouterModule.forRoot(routes);
