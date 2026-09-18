import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { CdkScrollable } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-delete-saved-search-dialog',
  templateUrl: './delete-saved-search-dialog.component.html',
  styleUrls: ['./delete-saved-search-dialog.component.scss'],
  imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatDialogActions],
})
export class DeleteSavedSearchDialogComponent {
  savedSearchText: string;
  searchDomain: string;

  constructor(
    private dialogRef: MatDialogRef<DeleteSavedSearchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.savedSearchText = data.savedSearchText;
    this.searchDomain = data.searchDomain;
  }

  delete() {
    this.dialogRef.close('DELETE_CONFIRMED');
  }

  close() {
    this.dialogRef.close('DELETE_CANCELED');
  }
}
