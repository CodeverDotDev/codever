import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { HowToBookmarkletComponent } from './howto-bookmarklets/how-to-bookmarklet.component';
import { HowtoComponent } from './howto.component';
import { HowtoGetStartedComponent } from './howto-get-started/howto-get-started.component';
import { HowtoHotkeysComponent } from './howto-hotkeys/howto-hotkeys.component';
import { HowToBookmarksComponent } from './howto-bookmarks/how-to-bookmarks.component';
import { HowToNotesComponent } from './howto-notes/how-to-notes.component';

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
    redirectTo: 'bookmarklet', // needed for already installed extension or bookmarklets
  },
  {
    path: 'bookmarklet',
    component: HowToBookmarkletComponent,
  },
  {
    path: 'bookmarks',
    component: HowToBookmarksComponent,
  },
  {
    path: 'notes',
    component: HowToNotesComponent,
  },
  {
    // Redirect old /howto/snippets URL to the new /howto/notes page
    path: 'snippets',
    redirectTo: 'notes',
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
