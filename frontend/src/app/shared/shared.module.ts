import { NgModule } from '@angular/core';
import { HighLightPipe } from './pipe/highlight.pipe';
import { HighLightHtmlPipe } from './pipe/highlight.no-html-tags.pipe';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AsyncBookmarkListComponent } from './async-bookmark-list/async-bookmark-list.component';
import { TagsValidatorDirective } from './directive/tags-validation.directive';
import { BookmarkTextComponent } from './bookmark-text/bookmark-text.component';
import { RouterModule } from '@angular/router';
import { DeleteResourceDialogComponent } from './dialog/delete-bookmark-dialog/delete-resource-dialog.component';
import { LoginRequiredDialogComponent } from './dialog/login-required-dialog/login-required-dialog.component';
import { SocialShareDialogComponent } from './dialog/social-share-dialog/social-share-dialog.component';
import { SocialButtonsModule } from '../social-buttons/social-buttons.module';
import {
  PlayYoutubeVideoDialogComponent
} from './dialog/play-youtube-video-dialog/play-youtube-video-dialog.component';
import { TagFollowingBaseComponent } from './tag-following-base-component/tag-following-base.component';
import { Markdown2HtmlPipe } from './pipe/markdown2html.pipe';
import { NavigationComponent } from './navigation/navigation.component';
import { SearchbarComponent } from './search/searchbar.component';
import { HotKeysDialogComponent } from './dialog/history-dialog/hot-keys-dialog.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { BookmarkListElementComponent } from './bookmark-list-element/bookmark-list-element.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { BookmarksFilterPipe } from './pipe/bookmarks-filter.pipe';
import { SnippetDetailsComponent } from './snippet-details/snippet-details.component';
import { CopySnippetButtonComponent } from './snippet-details/copy-snippet-button/copy-snippet-button.component';
import { HighlightModule } from 'ngx-highlightjs';
import { SnippetCardBodyComponent } from './snippet-details/snippet-card-body/snippet-card-body.component';
import { AsyncSnippetListComponent } from './async-snippet-list/async-snippet-list.component';
import { SearchFilterPipe } from './pipe/search-filter.pipe';
import { BackupBookmarksDialogComponent } from './dialog/backup-bookmarks-dialog/backup-bookmarks-dialog.component';
import {
  AddTagFilterToSearchDialogComponent
} from './search/add-tag-filter-dialog/add-tag-filter-to-search-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ImportBookmarksDialogComponent } from './dialog/import-bookmarks-dialog/import-bookmarks-dialog.component';
import { ExtensionsComponent } from './extensions/extensions.component';
import { AsyncSearchResultListComponent } from './async-search-result-list/async-search-result-list.component';
import { PageNavigationBarComponent } from './page-navigation-bar/page-navigation-bar.component';
import { NoteDetailsComponent } from './note-details/note-details.component';
import { NoteContentComponent } from './note-details/note-card-body/note-content.component';
import { AsyncNoteListComponent } from './async-note-list/async-note-list.component';
import { MarkedImageWidthDirective } from './directive/marked-image-width.directive';
import {
  SnippetSocialShareDialogComponent
} from './dialog/snippet-social-share-dialog/snippet-social-share-dialog.component';
import {
  SnippetSocialShareDialogContentComponent
} from './dialog/snippet-social-share-dialog/snippet-social-share-dialog-content/snippet-social-share-dialog-content.component';


/**
 * Add a SharedModule to hold the common components, directives, and pipes and share them with the modules that need them.
 * See - https://angular.io/guide/sharing-ngmodules
 */
@NgModule({
  imports: [
    SocialButtonsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatDialogModule,
    RouterModule,
    HighlightModule,
    MatFormFieldModule,
    MatChipsModule,
    MatIconModule,
  ],
  declarations: [
    HighLightPipe,
    HighLightHtmlPipe,
    Markdown2HtmlPipe,
    BookmarksFilterPipe,
    SearchFilterPipe,
    AsyncBookmarkListComponent,
    AsyncSnippetListComponent,
    AsyncSearchResultListComponent,
    BookmarkTextComponent,
    TagsValidatorDirective,
    MarkedImageWidthDirective,
    DeleteResourceDialogComponent,
    SocialShareDialogComponent,
    SnippetSocialShareDialogComponent,
    SnippetSocialShareDialogContentComponent,
    LoginRequiredDialogComponent,
    PlayYoutubeVideoDialogComponent,
    BackupBookmarksDialogComponent,
    ImportBookmarksDialogComponent,
    TagFollowingBaseComponent,
    SearchbarComponent,
    NavigationComponent,
    PageNavigationBarComponent,
    HotKeysDialogComponent,
    BookmarkListElementComponent,
    SnippetDetailsComponent,
    CopySnippetButtonComponent,
    SnippetCardBodyComponent,
    AddTagFilterToSearchDialogComponent,
    ExtensionsComponent,
    NoteDetailsComponent,
    NoteContentComponent,
    AsyncNoteListComponent,
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
    AsyncSnippetListComponent,
    AsyncSearchResultListComponent,
    BookmarkTextComponent,
    MatProgressSpinnerModule,
    NavigationComponent,
    SearchbarComponent,
    BookmarkListElementComponent,
    SnippetDetailsComponent,
    CopySnippetButtonComponent,
    ExtensionsComponent,
    NoteDetailsComponent,
    AsyncNoteListComponent,
  ]
})
export class SharedModule {
}
