import {NgModule} from "@angular/core";
import {HighLightPipe} from "./highlight.pipe";
import {HighLightHtmlPipe} from "./highlight.no-html-tags.pipe";


/**
 * Add a SharedModule to hold the common components, directives, and pipes and share them with the modules that need them.
 * See - https://angular.io/docs/ts/latest/guide/ngmodule.html#!#shared-module for more details
 */
@NgModule({
  declarations: [ HighLightPipe, HighLightHtmlPipe ],
  exports:      [ HighLightPipe, HighLightHtmlPipe ]
})
export class SharedModule { }
