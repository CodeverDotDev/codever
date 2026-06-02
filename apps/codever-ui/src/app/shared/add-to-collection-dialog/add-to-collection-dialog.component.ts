import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Collection } from '../../core/model/collection';
import { PersonalCollectionsService } from '../../core/personal-collections.service';

export interface AddToCollectionDialogData {
  resourceId?: string;
  resourceType: 'bookmark' | 'note';
  userId: string;
}

@Component({
  selector: 'app-add-to-collection-dialog',
  templateUrl: './add-to-collection-dialog.component.html',
  styleUrls: ['./add-to-collection-dialog.component.scss'],
})
export class AddToCollectionDialogComponent implements OnInit {
  collections: Collection[] = [];
  selectedCollectionIds: Set<string> = new Set();
  filterText = '';
  loading = true;

  // Inline create
  showCreateForm = false;
  newCollectionName = '';

  constructor(
    private dialogRef: MatDialogRef<AddToCollectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddToCollectionDialogData,
    private personalCollectionsService: PersonalCollectionsService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;

    // Load all collections
    this.personalCollectionsService
      .getUserCollections(this.data.userId, undefined, 1, 100)
      .subscribe((collections) => {
        this.collections = collections;

        // Load which collections already contain this resource (only if we have a resourceId)
        if (this.data.resourceId) {
          this.personalCollectionsService
            .getCollectionsContainingResource(
              this.data.userId,
              this.data.resourceId
            )
            .subscribe((containing) => {
              containing.forEach((c) => this.selectedCollectionIds.add(c._id));
              this.loading = false;
            });
        } else {
          this.loading = false;
        }
      });
  }

  get filteredCollections(): Collection[] {
    if (!this.filterText) {
      return this.collections;
    }
    const lower = this.filterText.toLowerCase();
    return this.collections.filter((c) =>
      c.name.toLowerCase().includes(lower)
    );
  }

  isSelected(collectionId: string): boolean {
    return this.selectedCollectionIds.has(collectionId);
  }

  toggleCollection(collection: Collection): void {
    if (this.isSelected(collection._id)) {
      // Remove from collection
      if (this.data.resourceId) {
        this.personalCollectionsService
          .removeItemFromCollection(
            this.data.userId,
            collection._id,
            this.data.resourceId
          )
          .subscribe(() => {
            this.selectedCollectionIds.delete(collection._id);
          });
      } else {
        // Deferred mode — just track locally
        this.selectedCollectionIds.delete(collection._id);
      }
    } else {
      // Add to collection
      if (this.data.resourceId) {
        this.personalCollectionsService
          .addItemToCollection(
            this.data.userId,
            collection._id,
            this.data.resourceId,
            this.data.resourceType
          )
          .subscribe(() => {
            this.selectedCollectionIds.add(collection._id);
          });
      } else {
        // Deferred mode — just track locally
        this.selectedCollectionIds.add(collection._id);
      }
    }
  }

  createNewCollection(): void {
    if (!this.newCollectionName.trim()) {
      return;
    }
    this.personalCollectionsService
      .createCollection(this.data.userId, {
        name: this.newCollectionName.trim(),
      })
      .subscribe((newCollection) => {
        this.collections.unshift(newCollection);
        // Auto-add the resource to the new collection if we have a resourceId
        if (this.data.resourceId) {
          this.personalCollectionsService
            .addItemToCollection(
              this.data.userId,
              newCollection._id,
              this.data.resourceId,
              this.data.resourceType
            )
            .subscribe(() => {
              this.selectedCollectionIds.add(newCollection._id);
              this.newCollectionName = '';
              this.showCreateForm = false;
            });
        } else {
          // Deferred mode — just select the new collection locally
          this.selectedCollectionIds.add(newCollection._id);
          this.newCollectionName = '';
          this.showCreateForm = false;
        }
      });
  }

  close(): void {
    this.dialogRef.close(
      this.data.resourceId ? undefined : Array.from(this.selectedCollectionIds)
    );
  }
}

