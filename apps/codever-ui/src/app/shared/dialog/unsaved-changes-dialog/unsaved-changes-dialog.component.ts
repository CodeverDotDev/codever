import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';

export type UnsavedChangesDialogResult = 'stay' | 'leave';

@Component({
  selector: 'app-unsaved-changes-dialog',
  templateUrl: './unsaved-changes-dialog.component.html',
  styleUrls: ['./unsaved-changes-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions],
})
export class UnsavedChangesDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<UnsavedChangesDialogComponent, UnsavedChangesDialogResult>
  );

  stay(): void {
    this.dialogRef.close('stay');
  }

  leave(): void {
    this.dialogRef.close('leave');
  }
}
