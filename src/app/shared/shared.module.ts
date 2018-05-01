import {NgModule} from '@angular/core';
import {HighLightPipe} from './highlight.pipe';
import {HighLightHtmlPipe} from './highlight.no-html-tags.pipe';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {AsyncBookmarkListComponent} from './async-bookmark-list.component';


/**
 * Add a SharedModule to hold the common components, directives, and pipes and share them with the modules that need them.
 * See - https://angular.io/guide/sharing-ngmodules
 */
@NgModule({
  imports:      [ CommonModule ],
  declarations: [ HighLightPipe, HighLightHtmlPipe, AsyncBookmarkListComponent ],
  exports:      [ HighLightPipe, HighLightHtmlPipe, AsyncBookmarkListComponent, CommonModule, FormsModule ]
})
export class SharedModule { }
