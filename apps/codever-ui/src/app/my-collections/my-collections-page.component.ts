import { Component, OnInit } from '@angular/core';
import { Collection } from '../core/model/collection';
import { PersonalCollectionsService } from '../core/personal-collections.service';
import { UserInfoStore } from '../core/user/user-info.store';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CollectionFormDialogComponent } from './collection-form-dialog/collection-form-dialog.component';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { UserData } from '../core/model/user-data';
import { UserDataStore } from '../core/user/userdata.store';
import { UserDataPinnedStore } from '../core/user/userdata.pinned.store';

@Component({
  selector: 'app-my-collections-page',
  templateUrl: './my-collections-page.component.html',
  styleUrls: ['./my-collections-page.component.scss'],
  imports: [FormsModule, DatePipe, AsyncPipe],
})
export class MyCollectionsPageComponent implements OnInit {
  collections: Collection[] = [];
  userId: string;
  filterText = '';
  currentPage = 1;
  loading = false;
  userData$: Observable<UserData>;

  constructor(
    private personalCollectionsService: PersonalCollectionsService,
    private userInfoStore: UserInfoStore,
    private dialog: MatDialog,
    private router: Router,
    private userDataStore: UserDataStore,
    private userDataPinnedStore: UserDataPinnedStore
  ) {
    this.userData$ = this.userDataStore.getUserData$();
  }

  ngOnInit(): void {
    this.userInfoStore.getUserInfoOidc$().subscribe((userInfo) => {
      this.userId = userInfo.sub;
      this.loadCollections();
    });
  }

  loadCollections(): void {
    this.loading = true;
    this.personalCollectionsService
      .getUserCollections(
        this.userId,
        this.filterText || undefined,
        this.currentPage,
        20
      )
      .subscribe((collections) => {
        this.collections = collections;
        this.loading = false;
      });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadCollections();
  }

  /**
   * Enter in the focused filter opens the only visible collection in the
   * current tab via the existing navigation. No-op for zero or many results.
   */
  onFilterEnter(): void {
    if (this.collections.length === 1) {
      this.openCollection(this.collections[0]);
    }
  }

  openCreateDialog(): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '400px';
    dialogConfig.data = { mode: 'create' };

    const dialogRef = this.dialog.open(
      CollectionFormDialogComponent,
      dialogConfig
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.personalCollectionsService
          .createCollection(this.userId, result)
          .subscribe((newCollection) => {
            this.collections.unshift(newCollection);
          });
      }
    });
  }

  openEditDialog(collection: Collection): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = '400px';
    dialogConfig.data = { mode: 'edit', collection };

    const dialogRef = this.dialog.open(
      CollectionFormDialogComponent,
      dialogConfig
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.personalCollectionsService
          .updateCollection(this.userId, collection._id, result)
          .subscribe((updated) => {
            const index = this.collections.findIndex(
              (c) => c._id === collection._id
            );
            if (index !== -1) {
              this.collections[index] = updated;
            }
          });
      }
    });
  }

  deleteCollection(collection: Collection): void {
    if (
      confirm(
        `Are you sure you want to delete "${collection.name}"? The bookmarks and notes inside will NOT be deleted.`
      )
    ) {
      this.personalCollectionsService
        .deleteCollection(this.userId, collection._id)
        .subscribe(() => {
          this.collections = this.collections.filter(
            (c) => c._id !== collection._id
          );
        });
    }
  }

  /** True when the collection is part of the user's typed pinned entries. */
  isPinned(userData: UserData | null, collection: Collection): boolean {
    return (userData?.pinned || []).some(
      (entry) => entry.type === 'collection' && entry.id === collection._id
    );
  }

  addToPinned(collection: Collection): void {
    this.userDataPinnedStore.addCollectionToPinned(collection);
  }

  removeFromPinned(collection: Collection): void {
    this.userDataPinnedStore.removeCollectionFromPinned(collection);
  }

  openCollection(collection: Collection): void {
    this.router.navigate(['/my-collections', collection._id]);
  }
}
