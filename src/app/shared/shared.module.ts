import {NgModule} from "@angular/core";
import {HighLightPipe} from "./highlight.pipe";


@NgModule({
  declarations: [ HighLightPipe ],
  exports:      [ HighLightPipe ]
})
export class SharedModule { }
