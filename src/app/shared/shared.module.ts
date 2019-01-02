import {NgModule} from '@angular/core';
import {HighLightPipe} from './highlight.pipe';
import {HighLightHtmlPipe} from './highlight.no-html-tags.pipe';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AsyncCodingmarkListComponent} from './async-codingmark-list.component';
import {TagsValidatorDirective} from './tags-validation.directive';
import {CodingmarkSearchComponent} from './search/codingmark-search.component';


/**
 * Add a SharedModule to hold the common components, directives, and pipes and share them with the modules that need them.
 * See - https://angular.io/guide/sharing-ngmodules
 */
@NgModule({
  imports:      [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  declarations: [
    HighLightPipe,
    HighLightHtmlPipe,
    AsyncCodingmarkListComponent,
    TagsValidatorDirective,
    CodingmarkSearchComponent
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HighLightPipe,
    HighLightHtmlPipe,
    AsyncCodingmarkListComponent,
    CodingmarkSearchComponent
  ]
})
export class SharedModule { }
