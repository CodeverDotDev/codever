import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UsedTag } from '../../../../core/model/used-tag';

@Component({
  selector: 'app-delete-bookmarks-by-tag-dialog',
  templateUrl: './delete-saved-search-dialog.component.html',
  styleUrls: ['./delete-saved-search-dialog.component.scss'],
})
export class DeleteSavedSearchDialogComponent implements OnInit {
  savedSearchText: string;
  searchDomain: string;

  constructor(
    private dialogRef: MatDialogRef<DeleteSavedSearchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.savedSearchText = data.savedSearchText;
    this.searchDomain = data.searchDomain;
  }

  ngOnInit() {}

  delete() {
    this.dialogRef.close('DELETE_CONFIRMED');
  }

  close() {
    this.dialogRef.close('DELETE_CANCELED');
  }
}
