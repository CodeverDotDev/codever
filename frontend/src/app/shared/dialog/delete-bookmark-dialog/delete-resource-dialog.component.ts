import { Component, Inject, OnInit } from '@angular/core';
import { Bookmark } from '../../../core/model/bookmark';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserData } from '../../../core/model/user-data';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-delete-bookmark-dialog',
  templateUrl: './delete-resource-dialog.component.html',
  styleUrls: ['./delete-resource-dialog.component.scss']
})
export class DeleteResourceDialogComponent implements OnInit {

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

  ngOnInit() {
  }

  delete() {
    this.dialogRef.close('DELETE_CONFIRMED');
  }

  close() {
    this.dialogRef.close('DELETE_CANCELED');
  }

}
