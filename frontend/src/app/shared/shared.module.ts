import { NgModule } from '@angular/core';
import { HighLightPipe } from './highlight.pipe';
import { HighLightHtmlPipe } from './highlight.no-html-tags.pipe';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AsyncBookmarkListComponent } from './async-bookmark-list.component';
import { TagsValidatorDirective } from './tags-validation.directive';
import { BookmarkTextComponent } from './bookmark-text.component';
import { MatAutocompleteModule, MatDialogModule, MatProgressSpinnerModule } from '@angular/material';
import { RouterModule } from '@angular/router';
import { DeleteBookmarkDialogComponent } from './delete-bookmark-dialog/delete-bookmark-dialog.component';
import { LoginRequiredDialogComponent } from './login-required-dialog/login-required-dialog.component';
import { SocialShareDialogComponent } from './social-share-dialog/social-share-dialog.component';
import { SocialButtonsModule } from '../social-buttons/social-buttons.module';
import { PlayYoutubeVideoDialogComponent } from './play-youtube-video-dialog/play-youtube-video-dialog.component';
import { TagFollowingBaseComponent } from './tag-following-base-component/tag-following-base.component';
import { Markdown2HtmlPipe } from './markdown2html.pipe';


/**
 * Add a SharedModule to hold the common components, directives, and pipes and share them with the modules that need them.
 * See - https://angular.io/guide/sharing-ngmodules
 */
@NgModule({
  imports:      [
    SocialButtonsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    RouterModule
  ],
  declarations: [
    HighLightPipe,
    HighLightHtmlPipe,
    Markdown2HtmlPipe,
    AsyncBookmarkListComponent,
    BookmarkTextComponent,
    TagsValidatorDirective,
    DeleteBookmarkDialogComponent,
    SocialShareDialogComponent,
    LoginRequiredDialogComponent,
    PlayYoutubeVideoDialogComponent,
    TagFollowingBaseComponent
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HighLightPipe,
    HighLightHtmlPipe,
    Markdown2HtmlPipe,
    AsyncBookmarkListComponent,
    BookmarkTextComponent,
    MatProgressSpinnerModule
  ],
  entryComponents: [
    DeleteBookmarkDialogComponent,
    LoginRequiredDialogComponent,
    SocialShareDialogComponent,
    PlayYoutubeVideoDialogComponent
  ]
})
export class SharedModule { }
