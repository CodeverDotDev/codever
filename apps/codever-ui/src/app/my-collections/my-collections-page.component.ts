import { Component, OnInit } from '@angular/core';
import { Collection } from '../core/model/collection';
import { PersonalCollectionsService } from '../core/personal-collections.service';
import { UserInfoStore } from '../core/user/user-info.store';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CollectionFormDialogComponent } from './collection-form-dialog/collection-form-dialog.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-my-collections-page',
  templateUrl: './my-collections-page.component.html',
  styleUrls: ['./my-collections-page.component.scss'],
})
export class MyCollectionsPageComponent implements OnInit {
  collections: Collection[] = [];
  userId: string;
  filterText = '';
  currentPage = 1;
  loading = false;

  constructor(
    private personalCollectionsService: PersonalCollectionsService,
    private userInfoStore: UserInfoStore,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userInfoStore.getUserInfoOidc$().subscribe((userInfo) => {
      this.userId = userInfo.sub;
      this.loadCollections();
    });
  }

  loadCollections(): void {
    this.loading = true;
    this.personalCollectionsService
      .getUserCollections(this.userId, this.filterText || undefined, this.currentPage, 20)
      .subscribe((collections) => {
        this.collections = collections;
        this.loading = false;
      });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadCollections();
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

  openCollection(collection: Collection): void {
    this.router.navigate(['/my-collections', collection._id]);
  }
}

