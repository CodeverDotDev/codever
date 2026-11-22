import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import iziToast from 'izitoast';

import { AdminService } from '../../core/admin/admin.service';
import {
  AdminBulkAction,
  AdminBulkResult,
  AdminEntryRef,
  AdminEntryType,
  AdminPublicEntry,
} from '../../core/admin/admin.model';
import {
  AdminConfirmDialogComponent,
  AdminConfirmDialogData,
} from '../admin-confirm-dialog/admin-confirm-dialog.component';

export const ADMIN_PAGE_SIZE = 25;

type TypeFilter = 'all' | AdminEntryType;

const ACTION_LABELS: Record<AdminBulkAction, string> = {
  unpublish: 'Unpublish',
  delete: 'Delete',
};

const entryKey = (entry: AdminEntryRef) => `${entry.type}:${entry.id}`;

/**
 * Latest and searched public bookmarks and notes of all users, with single
 * and bulk unpublish/delete. Filters live in the URL query parameters.
 */
@Component({
  selector: 'app-admin-public-content',
  templateUrl: './admin-public-content.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule, RouterLink, DatePipe],
})
export class AdminPublicContentComponent implements OnInit {
  readonly pageSize = ADMIN_PAGE_SIZE;

  q = '';
  type: TypeFilter = 'all';
  userId = '';
  page = 1;

  entries: AdminPublicEntry[] = [];
  selected = new Set<string>();
  loading = false;
  busy = false;
  errorMessage: string;
  failedEntries: (AdminEntryRef & { reason: string; title?: string })[] = [];

  private destroyRef = inject(DestroyRef);

  constructor(
    private adminService: AdminService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.readFilters(params);
        this.load();
      });
  }

  private readFilters(params: ParamMap): void {
    this.q = params.get('q') || '';
    const type = params.get('type');
    this.type = type === 'bookmark' || type === 'note' ? type : 'all';
    this.userId = params.get('userId') || '';
    const page = parseInt(params.get('page'), 10);
    this.page = page > 0 ? page : 1;
  }

  /** Applies the form filters through the URL, starting at page 1. */
  search(): void {
    this.navigate(1);
  }

  clearUserFilter(): void {
    this.userId = '';
    this.navigate(1);
  }

  goToPage(page: number): void {
    this.navigate(page);
  }

  private navigate(page: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.q || null,
        type: this.type === 'all' ? null : this.type,
        userId: this.userId || null,
        page: page > 1 ? page : null,
      },
    });
  }

  load(): void {
    this.loading = true;
    this.errorMessage = undefined;
    this.selected.clear();
    this.adminService
      .getPublicEntries({
        q: this.q,
        type: this.type,
        userId: this.userId,
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
          this.errorMessage = 'The public entries could not be loaded.';
        },
      });
  }

  get hasNextPage(): boolean {
    return this.entries.length === this.pageSize;
  }

  isSelected(entry: AdminEntryRef): boolean {
    return this.selected.has(entryKey(entry));
  }

  toggle(entry: AdminEntryRef): void {
    const key = entryKey(entry);
    if (this.selected.has(key)) {
      this.selected.delete(key);
    } else {
      this.selected.add(key);
    }
  }

  get allSelected(): boolean {
    return (
      this.entries.length > 0 && this.selected.size === this.entries.length
    );
  }

  toggleAll(): void {
    if (this.allSelected) {
      this.selected.clear();
    } else {
      this.entries.forEach((entry) => this.selected.add(entryKey(entry)));
    }
  }

  get selectedEntries(): AdminPublicEntry[] {
    return this.entries.filter((entry) => this.isSelected(entry));
  }

  openLink(entry: AdminPublicEntry): string[] {
    return entry.type === 'bookmark'
      ? ['/bookmarks', entry.id]
      : ['/notes', entry.id, 'details'];
  }

  unpublish(entry: AdminPublicEntry): void {
    this.runSingle('unpublish', entry, () =>
      this.adminService.unpublishEntry(entry)
    );
  }

  delete(entry: AdminPublicEntry): void {
    this.runSingle('delete', entry, () => this.adminService.deleteEntry(entry));
  }

  private runSingle(
    action: AdminBulkAction,
    entry: AdminPublicEntry,
    request: () => Observable<unknown>
  ): void {
    this.confirm(action, [entry]).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.busy = true;
      request().subscribe({
        next: () => {
          this.busy = false;
          this.removeEntries([entry]);
          iziToast.success({
            title: `${ACTION_LABELS[action]}: done`,
            message: entry.title,
            timeout: 4000,
          });
        },
        error: (error) => {
          this.busy = false;
          iziToast.error({
            title: `${ACTION_LABELS[action]} failed`,
            message:
              error?.status === 404
                ? 'The entry is no longer public or was deleted.'
                : 'Please try again later.',
          });
        },
      });
    });
  }

  bulk(action: AdminBulkAction): void {
    const entries = this.selectedEntries;
    if (entries.length === 0) {
      return;
    }
    this.confirm(action, entries).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.busy = true;
      this.failedEntries = [];
      this.adminService.bulkModerate(action, entries).subscribe({
        next: (result) => this.onBulkResult(action, entries, result),
        error: () => {
          this.busy = false;
          iziToast.error({
            title: `${ACTION_LABELS[action]} failed`,
            message: 'No entry was changed. Please try again later.',
          });
        },
      });
    });
  }

  private onBulkResult(
    action: AdminBulkAction,
    entries: AdminPublicEntry[],
    result: AdminBulkResult
  ): void {
    this.busy = false;
    const succeeded = new Set(result.succeeded.map(entryKey));
    this.removeEntries(entries.filter((entry) => succeeded.has(entryKey(entry))));
    const titles = new Map(entries.map((entry) => [entryKey(entry), entry.title]));
    this.failedEntries = result.failed.map((failure) => ({
      ...failure,
      title: titles.get(entryKey(failure)),
    }));
    const message = `${result.succeeded.length} done` +
      (result.failed.length ? `, ${result.failed.length} failed` : '');
    if (result.failed.length) {
      iziToast.warning({ title: ACTION_LABELS[action], message });
    } else {
      iziToast.success({ title: ACTION_LABELS[action], message, timeout: 4000 });
    }
  }

  private removeEntries(removed: AdminEntryRef[]): void {
    const keys = new Set(removed.map(entryKey));
    this.entries = this.entries.filter((entry) => !keys.has(entryKey(entry)));
    keys.forEach((key) => this.selected.delete(key));
  }

  private confirm(
    action: AdminBulkAction,
    entries: AdminPublicEntry[]
  ): Observable<boolean> {
    const count = entries.length;
    const noun = count === 1 ? 'entry' : 'entries';
    const message =
      action === 'unpublish'
        ? `Make ${count} public ${noun} private? The owners keep them and can` +
          ' publish them again.'
        : `Delete ${count} public ${noun}? Share links, favorites, pins and` +
          ' read-later references are removed. You can restore the' +
          ' entries from the audit log for 90 days.';
    const data: AdminConfirmDialogData = {
      title: `${ACTION_LABELS[action]} ${count} ${noun}`,
      message,
      confirmLabel: ACTION_LABELS[action],
      items: entries.map((entry) => entry.title),
    };
    return this.dialog
      .open(AdminConfirmDialogComponent, { data, autoFocus: false })
      .afterClosed();
  }
}
