import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-bookmark-dialog',
  templateUrl: './delete-resource-dialog.component.html',
  styleUrls: ['./delete-resource-dialog.component.scss'],
})
export class DeleteResourceDialogComponent {
  resourceName: string;
  isPublic = false;
  type: 'bookmark' | 'snippet' | 'note';

  constructor(
    private dialogRef: MatDialogRef<DeleteResourceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.isPublic = data.isPublic;
    this.type = data.type;
    this.resourceName = data.resourceName;
  }

  delete() {
    this.dialogRef.close('DELETE_CONFIRMED');
  }

  close() {
    this.dialogRef.close('DELETE_CANCELED');
  }
}
