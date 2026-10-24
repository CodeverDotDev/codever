import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { Bookmark } from '../../../core/model/bookmark';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { UserData } from '../../../core/model/user-data';
import { DatePipe } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { TweetComponent } from '../../../social-buttons/tweet.component';
import { ShareLinksService } from '../../../core/share-links.service';
import {
  ActiveShareLinkStatus,
  ShareLinkResourceStatus,
} from '../../../core/model/share-link';
import { StopSharingDialogComponent } from '../stop-sharing-dialog/stop-sharing-dialog.component';

@Component({
  selector: 'app-social-share-dialog',
  templateUrl: './social-share-dialog.component.html',
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    TweetComponent,
    MatDialogActions,
  ],
})
export class SocialShareDialogComponent {
  userIsLoggedIn: boolean;
  userOwnsBookmark: boolean;
  public bookmark: Bookmark;
  userData: UserData;
  tagsStr: string;
  tweetText: string;
  copyLinkButtonText = 'Link';
  copyLinkButtonShareableText = 'Copy';
  shareStatus: 'loading' | 'inactive' | 'active' | 'error' = 'inactive';
  shareLink: ActiveShareLinkStatus | null = null;
  shareError = '';
  sharingActionInProgress = false;
  private userId: string;
  readonly environment = environment;

  constructor(
    private datePipe: DatePipe,
    private dialogRef: MatDialogRef<SocialShareDialogComponent>,
    private shareLinksService: ShareLinksService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.bookmark = data.bookmark;
    this.userIsLoggedIn = data.userIsLoggedIn;
    this.userOwnsBookmark = data.userOwnsBookmark;
    this.userId = data.userId;
    if (this.canManageSharing) {
      this.loadShareStatus();
    }
    this.tagsStr = this.bookmark.tags
      .map((tag) => {
        return this.prepareTagForTweet(tag);
      })
      .join(',');
    this.tweetText = this.bookmark.name + '\n';
    if (this.bookmark.publishedOn) {
      this.tweetText +=
        'Published on ' +
        this.datePipe.transform(this.bookmark.publishedOn, 'yyyy-MM-dd') +
        '\n';
    }
    if (this.bookmark.sourceCodeURL) {
      this.tweetText += 'Source code ' + this.bookmark.sourceCodeURL + '\n\n';
    }
  }

  get canManageSharing(): boolean {
    return !!(
      this.userIsLoggedIn &&
      this.userOwnsBookmark &&
      this.userId &&
      this.bookmark?._id
    );
  }

  get shareUrl(): string | null {
    return this.shareLink
      ? `${this.environment.HOST}/bookmarks/shared/${this.shareLink.token}`
      : null;
  }

  loadShareStatus(): void {
    this.shareStatus = 'loading';
    this.shareError = '';
    this.shareLinksService
      .getStatus(this.userId, 'bookmark', this.bookmark._id)
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
      .create(this.userId, 'bookmark', this.bookmark._id)
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
          this.copyLinkButtonShareableText = 'Copied';
          setTimeout(() => (this.copyLinkButtonShareableText = 'Copy'), 1300);
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
      resourceTitle: this.bookmark?.name,
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

  cancel() {
    this.dialogRef.close('SHARE_CANCELED');
  }

  onShareButtonClick() {
    this.dialogRef.close('SHARE_BUTTON_CLICKED');
  }

  /**
   * Multiple word tagsStr are "-" separated for codingmarks. To make them twitter conform we will camel case them
   * e.g. "protocal-buffers" will become "#ProtocalBuffers". For single words #java becomes #Java.
   *
   * @param tag
   */
  private prepareTagForTweet(tag: string): string {
    return tag
      .split('-')
      .map((word) => {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('');
  }

  copyToClipboard(location: string, trigger: string) {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = location;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    const copyResult = document.execCommand('copy');
    if (copyResult) {
      if (trigger === 'linkButton') {
        this.copyLinkButtonText = 'Copied';
        setTimeout(() => (this.copyLinkButtonText = 'Link'), 1300);
      }
    }
    document.body.removeChild(selBox);
  }
}
