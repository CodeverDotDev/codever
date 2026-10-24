import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  Optional,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { CdkScrollable } from '@angular/cdk/scrolling';

export interface StopSharingDialogData {
  resourceTitle?: string;
}

@Component({
  selector: 'app-stop-sharing-dialog',
  templateUrl: './stop-sharing-dialog.component.html',
  styleUrls: ['./stop-sharing-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatDialogActions],
})
export class StopSharingDialogComponent {
  resourceTitle?: string;

  constructor(
    private dialogRef: MatDialogRef<StopSharingDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) data?: StopSharingDialogData
  ) {
    this.resourceTitle = data?.resourceTitle;
  }

  confirm(): void {
    this.dialogRef.close('CONFIRM');
  }

  close(): void {
    this.dialogRef.close('CANCEL');
  }
}
