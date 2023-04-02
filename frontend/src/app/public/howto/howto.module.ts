import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HowToBookmarkletComponent } from './howto-bookmarklets/how-to-bookmarklet.component';
import { HowToSnippetComponent } from './howto-snippets/how-to-snippet.component';
import { HowtoRoutingModule } from './howto-routing.module';
import { HowtoComponent } from './howto.component';
import { HowtoGetStartedComponent } from './howto-get-started/howto-get-started.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { AddBookmarkBookmarkletComponent } from './shared/add-bookmark-bookmarklet.component';
import { AddSnippetBookmarkletComponent } from './shared/add-snippet-bookmarklet.component';
import { HowtoHotkeysComponent } from './howto-hotkeys/howto-hotkeys.component';
import { MatTabsModule } from '@angular/material/tabs';
import { HowToBookmarksComponent } from './howto-bookmarks/how-to-bookmarks.component';
import { CodeverBookmarkletComponent } from './shared/codever-bookmarklet/codever-bookmarklet.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    HowtoComponent,
    HowtoGetStartedComponent,
    HowToBookmarksComponent,
    HowToBookmarkletComponent,
    HowToSnippetComponent,
    AddBookmarkBookmarkletComponent,
    AddSnippetBookmarkletComponent,
    CodeverBookmarkletComponent,
    HowtoHotkeysComponent,
  ],
  exports: [],
  imports: [
    HowtoRoutingModule,
    CommonModule,
    MatExpansionModule,
    MatTabsModule,
    SharedModule,
  ],
})
export class HowtoModule {}
