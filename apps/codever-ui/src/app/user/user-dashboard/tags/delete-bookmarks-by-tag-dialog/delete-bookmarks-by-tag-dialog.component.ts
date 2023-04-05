import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-bookmarks-by-tag-dialog',
  templateUrl: './delete-bookmarks-by-tag-dialog.component.html',
  styleUrls: ['./delete-bookmarks-by-tag-dialog.component.scss'],
})
export class DeleteBookmarksByTagDialogComponent {
  tag: string;

  constructor(
    private dialogRef: MatDialogRef<DeleteBookmarksByTagDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    console.log('data.tag ', data);
    this.tag = data.tag;
  }

  delete() {
    this.dialogRef.close('DELETE_CONFIRMED');
  }

  close() {
    this.dialogRef.close('DELETE_CANCELED');
  }
}
