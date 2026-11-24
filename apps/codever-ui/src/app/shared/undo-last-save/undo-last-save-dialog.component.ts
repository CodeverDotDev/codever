import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { CdkScrollable } from '@angular/cdk/scrolling';

export interface UndoLastSaveDialogData {
  entryTitle?: string;
}

@Component({
  selector: 'app-undo-last-save-dialog',
  templateUrl: './undo-last-save-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatDialogActions],
})
export class UndoLastSaveDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<UndoLastSaveDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UndoLastSaveDialogData
  ) {}

  confirm(): void {
    this.dialogRef.close('CONFIRM');
  }

  close(): void {
    this.dialogRef.close('CANCEL');
  }
}
