import {NgModule} from "@angular/core";
import {HighLightPipe} from "./highlight.pipe";
import {HighLightHtmlPipe} from "./highlight.no-html-tags.pipe";


@NgModule({
  declarations: [ HighLightPipe, HighLightHtmlPipe ],
  exports:      [ HighLightPipe, HighLightHtmlPipe ]
})
export class SharedModule { }
