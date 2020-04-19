import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { UserData } from '../../core/model/user-data';
import { Observable } from 'rxjs';
import { Codelet } from '../../core/model/codelet';

@Component({
  selector: 'app-delete-bookmark-dialog',
  templateUrl: './delete-codelet-dialog.component.html',
  styleUrls: ['./delete-codelet-dialog.component.scss']
})
export class DeleteCodeletDialogComponent implements OnInit {

  codeletTitle: string;
  userData$: Observable<UserData>;

  constructor(
    private dialogRef: MatDialogRef<DeleteCodeletDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.codeletTitle = data.codeletTitle;
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
