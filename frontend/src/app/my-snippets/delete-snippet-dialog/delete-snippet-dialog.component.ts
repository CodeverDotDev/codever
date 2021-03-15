import { Component, Inject, OnInit } from '@angular/core';
import { UserData } from '../../core/model/user-data';
import { Observable } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-bookmark-dialog',
  templateUrl: './delete-snippet-dialog.component.html',
  styleUrls: ['./delete-snippet-dialog.component.scss']
})
export class DeleteSnippetDialogComponent implements OnInit {

  snippetTitle: string;
  userData$: Observable<UserData>;

  constructor(
    private dialogRef: MatDialogRef<DeleteSnippetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.snippetTitle = data.codeletTitle;
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
