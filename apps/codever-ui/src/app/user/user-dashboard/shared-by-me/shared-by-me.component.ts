import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ShareLinksService } from '../../../core/share-links.service';
import { environment } from '../../../../environments/environment';
import {
  ActiveShareLinkStatus,
  ShareLinkListItem,
  ShareLinkListResponse,
  ShareableResourceType,
} from '../../../core/model/share-link';
import { StopSharingDialogComponent } from '../../../shared/dialog/stop-sharing-dialog/stop-sharing-dialog.component';

@Component({
  selector: 'app-shared-by-me',
  templateUrl: './shared-by-me.component.html',
  styleUrls: ['./shared-by-me.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [DatePipe],
})
export class SharedByMeComponent implements OnChanges {
  readonly Math = Math;
  @Input() userId: string;

  items: ShareLinkListItem[] = [];
  page = 1;
  readonly limit = 20;
  total = 0;
  loading = false;
  error = '';
  actionError = '';
  pendingShareLinkId: string | null = null;
  copiedShareLinkId: string | null = null;

  constructor(
    private shareLinksService: ShareLinksService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId']?.currentValue) {
      this.loadPage(1);
    }
  }

  loadPage(page: number): void {
    if (!this.userId || this.loading) return;
    this.loading = true;
    this.error = '';
    this.shareLinksService.list(this.userId, page, this.limit).subscribe({
      next: (result: ShareLinkListResponse) => {
        const lastPage = Math.max(1, Math.ceil(result.total / this.limit));
        if (page > lastPage) {
          this.loading = false;
          this.loadPage(lastPage);
          return;
        }
        this.items = result.items;
        this.page = result.page;
        this.total = result.total;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Your shared resources could not be loaded.';
      },
    });
  }

  copyLink(item: ShareLinkListItem): void {
    if (this.pendingShareLinkId) return;
    this.pendingShareLinkId = item.shareLinkId;
    this.actionError = '';
    this.shareLinksService
      .getStatus(this.userId, item.resourceType, item.resourceId)
      .subscribe({
        next: (status) => {
          if (!status.active) {
            this.actionError =
              'This link is no longer active. Refresh the list to update it.';
            this.pendingShareLinkId = null;
            return;
          }
          const url = this.shareUrl(item.resourceType, status);
          const clipboardWrite = navigator.clipboard?.writeText;
          if (!clipboardWrite) {
            this.actionError = 'The link could not be copied.';
            this.pendingShareLinkId = null;
            return;
          }
          try {
            clipboardWrite.call(navigator.clipboard, url).then(
              () => {
                this.copiedShareLinkId = item.shareLinkId;
                this.pendingShareLinkId = null;
                setTimeout(() => {
                  this.copiedShareLinkId = null;
                }, 1300);
              },
              () => {
                this.actionError = 'The link could not be copied.';
                this.pendingShareLinkId = null;
              }
            );
          } catch {
            this.actionError = 'The link could not be copied.';
            this.pendingShareLinkId = null;
          }
        },
        error: () => {
          this.actionError = 'The current sharing link could not be loaded.';
          this.pendingShareLinkId = null;
        },
      });
  }

  stopSharing(item: ShareLinkListItem): void {
    if (this.pendingShareLinkId) return;

    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      resourceTitle: item.title,
    };

    const dialogRef = this.dialog.open(
      StopSharingDialogComponent,
      dialogConfig
    );
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'CONFIRM') {
        this.pendingShareLinkId = item.shareLinkId;
        this.actionError = '';
        this.shareLinksService.revoke(this.userId, item.shareLinkId).subscribe({
          next: () => {
            this.pendingShareLinkId = null;
            this.loadPage(this.page);
          },
          error: () => {
            this.pendingShareLinkId = null;
            this.actionError = 'The sharing link could not be revoked.';
          },
        });
      }
    });
  }

  openResource(item: ShareLinkListItem): void {
    const route =
      item.resourceType === 'bookmark'
        ? ['/my-bookmarks', item.resourceId, 'details']
        : ['/my-notes', item.resourceId, 'details'];
    void this.router.navigate(route);
  }

  private shareUrl(
    resourceType: ShareableResourceType,
    status: ActiveShareLinkStatus
  ): string {
    return `${environment.HOST}/${resourceType === 'bookmark' ? 'bookmarks' : 'notes'}/shared/${status.token}`;
  }
}
