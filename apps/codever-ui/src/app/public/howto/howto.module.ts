import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HowToBookmarkletComponent } from './howto-bookmarklets/how-to-bookmarklet.component';
import { HowtoComponent } from './howto.component';
import { HowtoGetStartedComponent } from './howto-get-started/howto-get-started.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { HowtoHotkeysComponent } from './howto-hotkeys/howto-hotkeys.component';
import { MatTabsModule } from '@angular/material/tabs';
import { HowToBookmarksComponent } from './howto-bookmarks/how-to-bookmarks.component';
import { HowToNotesComponent } from './howto-notes/how-to-notes.component';
import { CodeverBookmarkletComponent } from './howto-bookmarklets/codever-bookmarklet/codever-bookmarklet.component';
import { HowToMcpComponent } from './howto-mcp/how-to-mcp.component';

import { RouterModule, Routes } from '@angular/router';

const howToRoutes: Routes = [
  { path: '', component: HowtoComponent },
  { path: 'get-started', component: HowtoGetStartedComponent },
  { path: 'bookmarklets', redirectTo: 'bookmarklet' },
  { path: 'bookmarklet', component: HowToBookmarkletComponent },
  { path: 'bookmarks', component: HowToBookmarksComponent },
  { path: 'notes', component: HowToNotesComponent },
  { path: 'snippets', redirectTo: 'notes' },
  { path: 'hotkeys', component: HowtoHotkeysComponent },
  { path: 'mcp', component: HowToMcpComponent },
  { path: '**', component: HowtoComponent },
];

@NgModule({
  exports: [],
  imports: [
    RouterModule.forChild(howToRoutes),
    CommonModule,
    MatExpansionModule,
    MatTabsModule,
    RouterModule,
    HowtoComponent,
    HowtoGetStartedComponent,
    HowToBookmarksComponent,
    HowToBookmarkletComponent,
    HowToNotesComponent,
    CodeverBookmarkletComponent,
    HowtoHotkeysComponent,
    HowToMcpComponent,
  ],
})
export class HowtoModule {}
