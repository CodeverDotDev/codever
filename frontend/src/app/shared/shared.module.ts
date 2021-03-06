import { NgModule } from '@angular/core';
import { HighLightPipe } from './highlight.pipe';
import { HighLightHtmlPipe } from './highlight.no-html-tags.pipe';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AsyncBookmarkListComponent } from './async-bookmark-list.component';
import { TagsValidatorDirective } from './tags-validation.directive';
import { BookmarkTextComponent } from './bookmark-text.component';
import { RouterModule } from '@angular/router';
import { DeleteBookmarkDialogComponent } from './delete-bookmark-dialog/delete-bookmark-dialog.component';
import { LoginRequiredDialogComponent } from './login-required-dialog/login-required-dialog.component';
import { SocialShareDialogComponent } from './social-share-dialog/social-share-dialog.component';
import { SocialButtonsModule } from '../social-buttons/social-buttons.module';
import { PlayYoutubeVideoDialogComponent } from './play-youtube-video-dialog/play-youtube-video-dialog.component';
import { TagFollowingBaseComponent } from './tag-following-base-component/tag-following-base.component';
import { Markdown2HtmlPipe } from './markdown2html.pipe';
import { NavigationComponent } from './navigation/navigation.component';
import { SearchbarComponent } from './search/searchbar.component';
import { HotKeysDialogComponent } from './history-dialog/hot-keys-dialog.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { BookmarkListElementComponent } from './bookmark-list-element/bookmark-list-element.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { BookmarksFilterPipe } from './bookmarks-filter.pipe';
import { SnippetDetailsComponent } from './snippet-details/snippet-details.component';
import { CopySnippetButtonComponent } from './snippet-details/copy-snippet-button/copy-snippet-button.component';
import { HighlightModule } from 'ngx-highlightjs';
import { SnippetCardBodyComponent } from './snippet-details/snippet-card-body/snippet-card-body.component';
import { AsyncCodeletListComponent } from './async-codelet-list/async-codelet-list.component';
import { SearchFilterPipe } from './search-filter.pipe';


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
    MatExpansionModule,
    MatDialogModule,
    RouterModule,
    HighlightModule
  ],
  declarations: [
    HighLightPipe,
    HighLightHtmlPipe,
    Markdown2HtmlPipe,
    BookmarksFilterPipe,
    SearchFilterPipe,
    AsyncBookmarkListComponent,
    AsyncCodeletListComponent,
    BookmarkTextComponent,
    TagsValidatorDirective,
    DeleteBookmarkDialogComponent,
    SocialShareDialogComponent,
    LoginRequiredDialogComponent,
    PlayYoutubeVideoDialogComponent,
    TagFollowingBaseComponent,
    SearchbarComponent,
    NavigationComponent,
    HotKeysDialogComponent,
    BookmarkListElementComponent,
    SnippetDetailsComponent,
    CopySnippetButtonComponent,
    SnippetCardBodyComponent
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HighLightPipe,
    HighLightHtmlPipe,
    Markdown2HtmlPipe,
    SearchFilterPipe,
    AsyncBookmarkListComponent,
    AsyncCodeletListComponent,
    BookmarkTextComponent,
    MatProgressSpinnerModule,
    NavigationComponent,
    SearchbarComponent,
    BookmarkListElementComponent,
    SnippetDetailsComponent,
    CopySnippetButtonComponent
  ],
  entryComponents: [
    DeleteBookmarkDialogComponent,
    LoginRequiredDialogComponent,
    SocialShareDialogComponent,
    PlayYoutubeVideoDialogComponent,
    HotKeysDialogComponent
  ]
})
export class SharedModule { }
