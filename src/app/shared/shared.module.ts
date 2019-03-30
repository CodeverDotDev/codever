import {NgModule} from '@angular/core';
import {HighLightPipe} from './highlight.pipe';
import {HighLightHtmlPipe} from './highlight.no-html-tags.pipe';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AsyncBookmarkListComponent} from './async-bookmark-list.component';
import {TagsValidatorDirective} from './tags-validation.directive';
import {BookmarkSearchComponent} from './search/bookmark-search.component';
import {BookmarkTextComponent} from './bookmark-text.component';
import {DescriptionSizeValidatorDirective} from './description-size-validation.directive';
import {MatAutocompleteModule, MatProgressSpinner, MatProgressSpinnerModule} from '@angular/material';
import {RouterModule} from '@angular/router';


/**
 * Add a SharedModule to hold the common components, directives, and pipes and share them with the modules that need them.
 * See - https://angular.io/guide/sharing-ngmodules
 */
@NgModule({
  imports:      [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  declarations: [
    HighLightPipe,
    HighLightHtmlPipe,
    AsyncBookmarkListComponent,
    BookmarkTextComponent,
    TagsValidatorDirective,
    DescriptionSizeValidatorDirective,
    BookmarkSearchComponent
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HighLightPipe,
    HighLightHtmlPipe,
    AsyncBookmarkListComponent,
    BookmarkTextComponent,
    DescriptionSizeValidatorDirective,
    BookmarkSearchComponent,
    MatProgressSpinnerModule
  ]
})
export class SharedModule { }
