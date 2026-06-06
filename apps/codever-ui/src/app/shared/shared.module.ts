import { NgModule } from '@angular/core';
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
import { PlayYoutubeVideoDialogComponent } from './dialog/play-youtube-video-dialog/play-youtube-video-dialog.component';
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
import { HighlightModule } from 'ngx-highlightjs';
import { SearchFilterPipe } from './pipe/search-filter.pipe';
import { BackupBookmarksDialogComponent } from './dialog/backup-bookmarks-dialog/backup-bookmarks-dialog.component';
import { AddTagFilterToSearchDialogComponent } from './search/add-tag-filter-dialog/add-tag-filter-to-search-dialog.component';
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
import { NotebookRendererComponent } from './notebook-renderer/notebook-renderer.component';
import { MarkedImageWidthDirective } from './directive/marked-image-width.directive';
import { CopyCodeButtonDirective } from './directive/copy-code-button.directive';
import { FullscreenCodeButtonDirective } from './directive/fullscreen-code-button.directive';
import { NoteSocialShareDialogComponent } from './dialog/note-social-share-dialog/note-social-share-dialog.component';
import { NoteSocialShareDialogContentComponent } from './dialog/note-social-share-dialog/note-social-share-dialog-content/note-social-share-dialog-content.component';
import { HighLightPipe } from '../common/pipes/highlight.pipe';
import { OpenInNewTabDirective } from './directive/open-in-new-tab.directive';
import { AddToCollectionDialogComponent } from './add-to-collection-dialog/add-to-collection-dialog.component';

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
    HighLightPipe,
  ],
  declarations: [
    HighLightHtmlPipe,
    Markdown2HtmlPipe,
    BookmarksFilterPipe,
    SearchFilterPipe,
    AsyncBookmarkListComponent,
    AsyncSearchResultListComponent,
    BookmarkTextComponent,
    TagsValidatorDirective,
    OpenInNewTabDirective,
    MarkedImageWidthDirective,
    CopyCodeButtonDirective,
    FullscreenCodeButtonDirective,
    DeleteResourceDialogComponent,
    SocialShareDialogComponent,
    NoteSocialShareDialogComponent,
    NoteSocialShareDialogContentComponent,
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
    AddTagFilterToSearchDialogComponent,
    ExtensionsComponent,
    NoteDetailsComponent,
    NoteContentComponent,
    AsyncNoteListComponent,
    NotebookRendererComponent,
    AddToCollectionDialogComponent,
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HighLightHtmlPipe,
    Markdown2HtmlPipe,
    SearchFilterPipe,
    AsyncBookmarkListComponent,
    AsyncSearchResultListComponent,
    BookmarkTextComponent,
    MatProgressSpinnerModule,
    NavigationComponent,
    SearchbarComponent,
    BookmarkListElementComponent,
    ExtensionsComponent,
    NoteDetailsComponent,
    AsyncNoteListComponent,
    AddToCollectionDialogComponent,
  ],
})
export class SharedModule {}
