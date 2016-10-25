import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import {BookmarksComponent} from "./bookmark/bookmarks.component";
import {BookmarkDetailComponent} from "./bookmark/detail/bookmark-detail.component";
import {BookmarkFormComponent} from "./bookmark/form/bookmark-form.component";
import {WikipediaSearchComponent} from "./wikipedia/wikipedia-search.component";
import {BookmarkSearchComponent} from "./bookmark/search/bookmark-search.component";
import {BookmarkSearchFormControlComponent} from "./bookmark/search-formControl/bookmark-search-formControl.component";

const routes: Routes = [
  { path: '', component: BookmarksComponent },
  { path: 'about', component: AboutComponent},
  //{ path: 'bookmarks', component: BookmarksComponent},
  { path: 'new', component: BookmarkFormComponent},
  { path: 'wikipedia', component: WikipediaSearchComponent},
  { path: 'search', component: BookmarkSearchComponent},
  { path: 'searchControl', component: BookmarkSearchFormControlComponent},
  {
    path: 'bookmarks/:id',
    component: BookmarkDetailComponent
  },
];

export const routing = RouterModule.forRoot(routes);
