import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { Observable, Subscription } from 'rxjs';
import { UserDataResource } from '../../../core/model/user-data-resource.type';
import { Bookmark } from '../../../core/model/bookmark';
import { AddToHistoryService } from '../../../core/user/add-to-history.service';
import {
  BookmarkShortcutContext,
  MAIN_LINK_SHORTCUT_PRIORITY,
  MainLinkShortcutService,
} from '../../../core/shortcut/main-link-shortcut.service';
import { FormsModule } from '@angular/forms';
import { CdkScrollable } from '@angular/cdk/scrolling';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelContent,
} from '@angular/material/expansion';
import { RouterLink } from '@angular/router';
import { NoteContentComponent } from '../../note-details/note-card-body/note-content.component';
import { BookmarkTextComponent } from '../../bookmark-text/bookmark-text.component';
import { AsyncPipe, SlicePipe, DatePipe } from '@angular/common';
import { HighLightHtmlPipe } from '../../pipe/highlight.no-html-tags.pipe';
import { ResourceTitleFilterPipe } from '../../pipe/resource-title-filter.pipe';

@Component({
  selector: 'app-hotkeys-dialog',
  templateUrl: './hot-keys-dialog.component.html',
  styleUrls: ['./hot-keys-dialog.component.scss'],
  imports: [
    MatDialogTitle,
    FormsModule,
    CdkScrollable,
    MatDialogContent,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    RouterLink,
    MatDialogClose,
    MatExpansionPanelContent,
    NoteContentComponent,
    BookmarkTextComponent,
    AsyncPipe,
    SlicePipe,
    DatePipe,
    HighLightHtmlPipe,
    ResourceTitleFilterPipe,
  ],
})
export class HotKeysDialogComponent implements OnInit, OnDestroy {
  userDataResources$: Observable<UserDataResource[]>;
  title: string;
  filterText: '';

  /** Snapshot of the dialog's resources, kept for shortcut resolution. */
  private resources: UserDataResource[] = [];
  private resourcesSubscription: Subscription;
  private readonly titleFilter = new ResourceTitleFilterPipe();
  private readonly shortcutContext: BookmarkShortcutContext = {
    priority: MAIN_LINK_SHORTCUT_PRIORITY.DIALOG,
    getSingleVisibleBookmark: () => this.singleVisibleBookmark(),
    // Pinned/History dialogs are only shown to signed-in users.
    isUserLoggedIn: () => true,
  };

  constructor(
    private dialogRef: MatDialogRef<HotKeysDialogComponent>,
    public addToHistoryService: AddToHistoryService,
    private mainLinkShortcutService: MainLinkShortcutService,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.userDataResources$ = data.resources$;
    this.title = data.title;
  }

  ngOnInit(): void {
    this.resourcesSubscription = this.userDataResources$.subscribe(
      (resources) => (this.resources = resources || [])
    );
    this.mainLinkShortcutService.register(this.shortcutContext);
  }

  ngOnDestroy(): void {
    this.resourcesSubscription?.unsubscribe();
    this.mainLinkShortcutService.unregister(this.shortcutContext);
  }

  isNote(resource: UserDataResource): boolean {
    return resource.type === 'note';
  }

  noteDetailsLink(resource: UserDataResource): string {
    return resource.public
      ? `/notes/${resource._id}/details`
      : `/my-notes/${resource._id}/details`;
  }

  /** Enter in the focused filter opens the only visible bookmark. */
  onFilterEnter(): void {
    const bookmark = this.singleVisibleBookmark();
    if (bookmark) {
      this.mainLinkShortcutService.openBookmarkInNewTab(bookmark, true);
    }
  }

  /** True when the current filter narrows the list to exactly one bookmark. */
  get hasSingleVisibleBookmark(): boolean {
    return this.singleVisibleBookmark() !== null;
  }

  /** The single visible bookmark after filtering, or null when ambiguous. */
  private singleVisibleBookmark(): Bookmark | null {
    const filtered = this.titleFilter.transform(
      this.resources,
      this.filterText
    );
    if (filtered.length === 1 && filtered[0].type === 'bookmark') {
      return filtered[0] as Bookmark;
    }
    return null;
  }
}
