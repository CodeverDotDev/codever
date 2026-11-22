import {
  ChangeDetectionStrategy,
  Component,
  Inject,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { CdkScrollable } from '@angular/cdk/scrolling';

export interface AdminConfirmDialogData {
  title: string;
  message: string;
  confirmLabel: string;
  /** Optional details, e.g. the titles of the affected entries. */
  items?: string[];
}

/** Confirmation for admin moderation actions; closes with true on confirm. */
@Component({
  selector: 'app-admin-confirm-dialog',
  templateUrl: './admin-confirm-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatDialogTitle, CdkScrollable, MatDialogContent, MatDialogActions],
})
export class AdminConfirmDialogComponent {
  readonly maxListedItems = 10;

  constructor(
    private dialogRef: MatDialogRef<AdminConfirmDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: AdminConfirmDialogData
  ) {}

  confirm(): void {
    this.dialogRef.close(true);
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
