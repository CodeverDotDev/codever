import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Bookmark } from '../../../core/model/bookmark';
import { Note } from '../../../core/model/note';
import { PersonalCollectionsService } from '../../../core/personal-collections.service';
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

  private readonly userId: string;
  private readonly collectionId: string;

  constructor(
    private personalCollectionsService: PersonalCollectionsService,
    @Inject(MAT_DIALOG_DATA) data: CollectionContentsDialogData
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
