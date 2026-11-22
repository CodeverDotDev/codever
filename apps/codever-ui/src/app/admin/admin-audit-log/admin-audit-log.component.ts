import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import iziToast from 'izitoast';

import { AdminService } from '../../core/admin/admin.service';
import {
  AdminAuditAction,
  AdminAuditEntry,
  AdminEntryType,
} from '../../core/admin/admin.model';
import {
  AdminConfirmDialogComponent,
  AdminConfirmDialogData,
} from '../admin-confirm-dialog/admin-confirm-dialog.component';

export const AUDIT_PAGE_SIZE = 25;

/** Admin moderation actions, newest first, with Restore on deletes. */
@Component({
  selector: 'app-admin-audit-log',
  templateUrl: './admin-audit-log.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule, DatePipe],
})
export class AdminAuditLogComponent implements OnInit {
  readonly pageSize = AUDIT_PAGE_SIZE;

  action: '' | AdminAuditAction = '';
  type: '' | AdminEntryType = '';
  page = 1;

  entries: AdminAuditEntry[] = [];
  loading = false;
  restoringId: string;
  errorMessage: string;
  notice: { kind: 'success' | 'warning' | 'danger'; text: string };

  constructor(
    private adminService: AdminService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.load();
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  goToPage(page: number): void {
    this.page = page;
    this.load();
  }

  get hasNextPage(): boolean {
    return this.entries.length === this.pageSize;
  }

  load(): void {
    this.loading = true;
    this.errorMessage = undefined;
    this.adminService
      .getAuditLog({
        action: this.action || undefined,
        type: this.type || undefined,
        page: this.page,
        limit: this.pageSize,
      })
      .subscribe({
        next: (entries) => {
          this.entries = entries;
          this.loading = false;
        },
        error: () => {
          this.entries = [];
          this.loading = false;
          this.errorMessage = 'The audit log could not be loaded.';
        },
      });
  }

  restore(entry: AdminAuditEntry): void {
    const data: AdminConfirmDialogData = {
      title: `Restore ${entry.targetType}`,
      message:
        `Restore "${entry.summary?.title}" with its original id, content and` +
        ' dates? Share links, favorites, likes, pins, read-later and history' +
        ' references are not restored.',
      confirmLabel: 'Restore',
    };
    this.dialog
      .open(AdminConfirmDialogComponent, { data, autoFocus: false })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.restoringId = entry._id;
        this.notice = undefined;
        this.adminService.restoreDeletedEntry(entry._id).subscribe({
          next: (result) => {
            this.restoringId = undefined;
            this.notice = result.restoredAsPrivate
              ? {
                  kind: 'warning',
                  text:
                    `"${entry.summary?.title}" was restored as private, because` +
                    ' another user has made the same URL public meanwhile.',
                }
              : {
                  kind: 'success',
                  text: `"${entry.summary?.title}" was restored.`,
                };
            iziToast.success({ title: 'Restored', timeout: 4000 });
            this.load();
          },
          error: (error: HttpErrorResponse) => {
            this.restoringId = undefined;
            this.notice = {
              kind: 'danger',
              text: this.restoreErrorText(error),
            };
            this.load();
          },
        });
      });
  }

  private restoreErrorText(error: HttpErrorResponse): string {
    if (error?.status === 409) {
      return `Could not restore: ${error.error?.message || 'it conflicts with current data'}.`;
    }
    if (error?.status === 404) {
      return 'Could not restore: the copy of the entry no longer exists (kept for 90 days).';
    }
    return 'Could not restore. Please try again later.';
  }
}
