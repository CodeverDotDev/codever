import { Component, Inject, OnInit } from '@angular/core';
import { Bookmark } from '../../../core/model/bookmark';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserData } from '../../../core/model/user-data';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-delete-bookmark-dialog',
  templateUrl: './delete-bookmark-dialog.component.html',
  styleUrls: ['./delete-bookmark-dialog.component.scss']
})
export class DeleteBookmarkDialogComponent implements OnInit {

  bookmark: Bookmark;
  userData$: Observable<UserData>;

  constructor(
    private dialogRef: MatDialogRef<DeleteBookmarkDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.bookmark = data.bookmark;
    this.userData$ = data.userData;
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
