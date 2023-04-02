import { RouterModule, Routes, UrlSegment } from '@angular/router';
import { NgModule } from '@angular/core';
import { HowToBookmarkletComponent } from './howto-bookmarklets/how-to-bookmarklet.component';
import { HowToSnippetComponent } from './howto-snippets/how-to-snippet.component';
import { HowtoComponent } from './howto.component';
import { HowtoGetStartedComponent } from './howto-get-started/howto-get-started.component';
import { HowtoHotkeysComponent } from './howto-hotkeys/howto-hotkeys.component';
import { HowToBookmarksComponent } from './howto-bookmarks/how-to-bookmarks.component';

const howToRoutes: Routes = [
  {
    path: '',
    component: HowtoComponent,
  },
  {
    path: 'get-started',
    component: HowtoGetStartedComponent,
  },
  {
    path: 'bookmarklets',
    component: HowToBookmarkletComponent,
  },
  {
    path: 'bookmarks',
    component: HowToBookmarksComponent,
  },
  {
    path: 'snippets',
    component: HowToSnippetComponent,
  },
  {
    path: 'snippets',
    redirectTo: 'snippets',
  },
  {
    path: 'hotkeys',
    component: HowtoHotkeysComponent,
  },
  {
    path: '**',
    component: HowtoComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(howToRoutes)],
  exports: [RouterModule],
})
export class HowtoRoutingModule {}
