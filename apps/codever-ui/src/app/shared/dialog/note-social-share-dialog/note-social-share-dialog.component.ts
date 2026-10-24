import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { environment } from '../../../../environments/environment';
import { Note } from '../../../core/model/note';
import { NoteSocialShareDialogContentComponent } from './note-social-share-dialog-content/note-social-share-dialog-content.component';
import { ShareLinksService } from '../../../core/share-links.service';
import {
  ActiveShareLinkStatus,
  ShareLinkResourceStatus,
} from '../../../core/model/share-link';
import { StopSharingDialogComponent } from '../stop-sharing-dialog/stop-sharing-dialog.component';

@Component({
  selector: 'app-note-social-share-dialog',
  templateUrl: './note-social-share-dialog.component.html',
  styleUrls: ['./note-social-share-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    NoteSocialShareDialogContentComponent,
    MatDialogActions,
  ],
})
export class NoteSocialShareDialogComponent {
  note: Note;
  userId: string;
  userOwnsNote = false;
  shareStatus: 'loading' | 'inactive' | 'active' | 'error' = 'inactive';
  shareLink: ActiveShareLinkStatus | null = null;
  shareError = '';
  sharingActionInProgress = false;
  copyButtonText = 'Copy link';
  readonly environment = environment;

  constructor(
    private dialogRef: MatDialogRef<NoteSocialShareDialogComponent>,
    private shareLinksService: ShareLinksService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.note = data.note;
    this.userId = data.userId;
    this.userOwnsNote = !!(
      this.userId &&
      this.note?.userId &&
      this.note.userId === this.userId
    );
    if (this.userOwnsNote) {
      this.loadShareStatus();
    }
  }

  get ordinaryPublicUrl(): string | null {
    return this.note.public && this.note._id
      ? `${this.environment.HOST}/notes/${this.note._id}`
      : null;
  }

  get shareUrl(): string | null {
    return this.shareLink
      ? `${this.environment.HOST}/notes/shared/${this.shareLink.token}`
      : null;
  }

  loadShareStatus(): void {
    this.shareStatus = 'loading';
    this.shareError = '';
    this.shareLinksService
      .getStatus(this.userId, 'note', this.note._id)
      .subscribe({
        next: (status) => this.applyShareStatus(status),
        error: () => {
          this.shareStatus = 'error';
          this.shareError = 'Sharing status could not be loaded.';
        },
      });
  }

  createShareLink(): void {
    if (this.sharingActionInProgress) return;
    this.sharingActionInProgress = true;
    this.shareError = '';
    this.shareLinksService
      .create(this.userId, 'note', this.note._id)
      .subscribe({
        next: (status) => {
          this.applyShareStatus(status);
          this.sharingActionInProgress = false;
        },
        error: () => {
          this.shareStatus = 'error';
          this.shareError = 'A sharing link could not be created.';
          this.sharingActionInProgress = false;
        },
      });
  }

  copyShareLink(): void {
    if (!this.shareUrl) return;
    this.shareError = '';
    const clipboardWrite = navigator.clipboard?.writeText;
    if (!clipboardWrite) {
      this.shareError = 'The link could not be copied.';
      return;
    }
    try {
      clipboardWrite.call(navigator.clipboard, this.shareUrl).then(
        () => {
          this.copyButtonText = 'Copied';
          setTimeout(() => (this.copyButtonText = 'Copy link'), 1300);
        },
        () => {
          this.shareError = 'The link could not be copied.';
        }
      );
    } catch {
      this.shareError = 'The link could not be copied.';
    }
  }

  stopSharing(): void {
    if (!this.shareLink || this.sharingActionInProgress) return;

    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      resourceTitle: this.note?.title,
    };

    const dialogRef = this.dialog.open(
      StopSharingDialogComponent,
      dialogConfig
    );
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'CONFIRM') {
        this.sharingActionInProgress = true;
        this.shareError = '';
        this.shareLinksService
          .revoke(this.userId, this.shareLink.shareLinkId)
          .subscribe({
            next: () => {
              this.shareLink = null;
              this.shareStatus = 'inactive';
              this.sharingActionInProgress = false;
            },
            error: () => {
              this.shareError = 'The sharing link could not be revoked.';
              this.sharingActionInProgress = false;
            },
          });
      }
    });
  }

  private applyShareStatus(status: ShareLinkResourceStatus): void {
    this.shareLink = status.active ? status : null;
    this.shareStatus = status.active ? 'active' : 'inactive';
  }

  close(): void {
    this.dialogRef.close('SHARE_CANCELED');
  }
}
