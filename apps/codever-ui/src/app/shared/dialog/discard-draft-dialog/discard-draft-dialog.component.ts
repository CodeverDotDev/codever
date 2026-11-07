import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';

export type DiscardDraftDialogResult = 'keep' | 'discard';

export interface DiscardDraftDialogData {
  /** Resource name shown in the dialog, e.g. "note" or "bookmark". */
  resourceName: string;
}

@Component({
  selector: 'app-discard-draft-dialog',
  templateUrl: './discard-draft-dialog.component.html',
  styleUrls: ['./discard-draft-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions],
})
export class DiscardDraftDialogComponent {
  readonly data = inject<DiscardDraftDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<DiscardDraftDialogComponent, DiscardDraftDialogResult>
  );

  keep(): void {
    this.dialogRef.close('keep');
  }

  discard(): void {
    this.dialogRef.close('discard');
  }
}
