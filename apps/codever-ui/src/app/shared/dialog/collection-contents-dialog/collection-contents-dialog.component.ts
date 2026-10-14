import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Bookmark } from '../../../core/model/bookmark';
import { Note } from '../../../core/model/note';
import { UserDataResource } from '../../../core/model/user-data-resource.type';
import { PersonalCollectionsService } from '../../../core/personal-collections.service';
import { MainLinkShortcutService } from '../../../core/shortcut/main-link-shortcut.service';
import {
  ActivatableType,
  activationHintLabel,
  singleVisibleResource,
} from '../../../core/shortcut/resource-activation.util';
import { filterCollectionContents } from './collection-contents.filter';

export interface CollectionContentsDialogData {
  userId: string;
  collectionId: string;
  collectionName: string;
}

/**
 * Shows a pinned collection's bookmarks and notes with a single free-text
 * filter (name/title/tag). The collection is fetched lazily when the dialog
 * opens, so the pinned list payload stays small.
 */
@Component({
  selector: 'app-collection-contents-dialog',
  templateUrl: './collection-contents-dialog.component.html',
  styleUrls: ['./collection-contents-dialog.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogClose,
    FormsModule,
    RouterLink,
  ],
})
export class CollectionContentsDialogComponent implements OnInit {
  collectionName: string;
  loading = true;
  filterText = '';
  bookmarks: Bookmark[] = [];
  notes: Note[] = [];
  filteredBookmarks: Bookmark[] = [];
  filteredNotes: Note[] = [];

  /** Resource types the focused dialog filter can activate with Enter. */
  readonly activatableTypes: ActivatableType[] = ['bookmark', 'note'];

  private readonly userId: string;
  private readonly collectionId: string;

  constructor(
    private personalCollectionsService: PersonalCollectionsService,
    @Inject(MAT_DIALOG_DATA) data: CollectionContentsDialogData,
    private dialogRef: MatDialogRef<CollectionContentsDialogComponent>,
    private mainLinkShortcutService: MainLinkShortcutService
  ) {
    this.userId = data.userId;
    this.collectionId = data.collectionId;
    this.collectionName = data.collectionName;
  }

  ngOnInit(): void {
    this.personalCollectionsService
      .getCollectionById(this.userId, this.collectionId)
      .subscribe((collection) => {
        const populatedItems = collection.populatedItems || [];
        this.bookmarks = populatedItems
          .filter((item) => item.resourceType === 'bookmark')
          .map((item) => item.resource as Bookmark);
        this.notes = populatedItems
          .filter((item) => item.resourceType === 'note')
          .map((item) => item.resource as Note);
        this.applyFilter();
        this.loading = false;
      });
  }

  applyFilter(): void {
    const result = filterCollectionContents(
      this.bookmarks,
      this.notes,
      this.filterText
    );
    this.filteredBookmarks = result.bookmarks;
    this.filteredNotes = result.notes;
  }

  get hasAnyMatch(): boolean {
    return this.filteredBookmarks.length > 0 || this.filteredNotes.length > 0;
  }

  /**
   * Enter in the focused filter activates the only visible result: a bookmark's
   * main link in a new tab, or a note's details page in the current tab. Both
   * lists are summed, so one bookmark plus one note is ambiguous and does
   * nothing. In-app navigation closes the dialog, matching the existing links.
   */
  onFilterEnter(): void {
    const resource = this.singleActivatableResource;
    if (!resource) {
      return;
    }
    const outcome = this.mainLinkShortcutService.activateResource(
      resource,
      true,
      this.activatableTypes
    );
    if (outcome === 'navigated') {
      this.dialogRef.close();
    }
  }

  /** Hint label for the focused filter, or null when Enter would do nothing. */
  get filterActivationHint(): ActivatableType | null {
    return activationHintLabel(this.singleActivatableResource);
  }

  /**
   * The single activatable result across both filtered lists, or null when zero
   * or several entries remain.
   */
  private get singleActivatableResource(): UserDataResource | null {
    return singleVisibleResource(
      [...this.filteredBookmarks, ...this.filteredNotes],
      this.activatableTypes
    );
  }

  /** Details route for a bookmark, matching the collection page's entry. */
  bookmarkDetailsLink(bookmark: Bookmark): (string | undefined)[] {
    const base =
      bookmark.userId === this.userId ? '/my-bookmarks' : '/bookmarks';
    return [base, bookmark._id, 'details'];
  }

  /** Details route for a note, matching the collection page's entry. */
  noteDetailsLink(note: Note): (string | undefined)[] {
    const base = note.userId === this.userId ? '/my-notes' : '/notes';
    return [base, note._id, 'details'];
  }
}
