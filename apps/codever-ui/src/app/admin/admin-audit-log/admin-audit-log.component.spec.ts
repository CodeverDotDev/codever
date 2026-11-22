import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of, throwError } from 'rxjs';

vi.mock('izitoast', () => ({
  default: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

import { AdminAuditLogComponent } from './admin-audit-log.component';
import { AdminService } from '../../core/admin/admin.service';
import { AdminAuditEntry } from '../../core/admin/admin.model';

const auditEntry = (
  id: string,
  overrides: Partial<AdminAuditEntry> = {}
): AdminAuditEntry => ({
  _id: id,
  action: 'delete',
  targetType: 'bookmark',
  targetId: `target-${id}`,
  ownerId: 'owner-1',
  adminId: 'admin-1',
  adminName: 'Admin',
  summary: { title: `Title ${id}`, location: 'https://example.com' },
  restorable: true,
  createdAt: '2026-11-21T10:00:00Z',
  ...overrides,
});

const setup = (
  restoreResponse: () => Observable<unknown>,
  confirmed = true
) => {
  const adminService = {
    getAuditLog: vi.fn(() =>
      of([
        auditEntry('a1'),
        auditEntry('a2', { restorable: false }),
        auditEntry('a3', { action: 'unpublish', restorable: false }),
      ])
    ),
    restoreDeletedEntry: vi.fn(restoreResponse),
  };
  const dialog = {
    open: vi.fn(() => ({ afterClosed: () => of(confirmed) })),
  };
  TestBed.configureTestingModule({
    imports: [AdminAuditLogComponent],
    providers: [
      { provide: AdminService, useValue: adminService },
      { provide: MatDialog, useValue: dialog },
    ],
  });
  const fixture = TestBed.createComponent(AdminAuditLogComponent);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const clickRestore = () => {
    (element.querySelector('button.restore-entry') as HTMLElement).click();
    fixture.detectChanges();
  };
  return { fixture, element, adminService, dialog, clickRestore };
};

describe('AdminAuditLogComponent', () => {
  it('lists entries and offers Restore only on restorable deletes', () => {
    const { element, adminService } = setup(() => of({}));

    expect(adminService.getAuditLog).toHaveBeenCalledWith({
      action: undefined,
      type: undefined,
      page: 1,
      limit: 25,
    });
    expect(element.querySelectorAll('tr.audit-entry')).toHaveLength(3);
    expect(element.querySelectorAll('button.restore-entry')).toHaveLength(1);
    expect(element.textContent).toContain('Title a1');
  });

  it('restores after confirmation and reloads the log', () => {
    const { element, adminService, clickRestore } = setup(() =>
      of({ type: 'bookmark', restoredAsPrivate: false, entry: {} })
    );

    clickRestore();

    expect(adminService.restoreDeletedEntry).toHaveBeenCalledWith('a1');
    expect(adminService.getAuditLog).toHaveBeenCalledTimes(2);
    expect(element.querySelector('.restore-notice').textContent).toContain(
      '"Title a1" was restored.'
    );
  });

  it('tells the admin when the entry came back as private', () => {
    const { element, clickRestore } = setup(() =>
      of({ type: 'bookmark', restoredAsPrivate: true, entry: {} })
    );

    clickRestore();

    expect(element.querySelector('.restore-notice').textContent).toContain(
      'restored as private'
    );
  });

  it('shows the conflict reason for a 409', () => {
    const { element, clickRestore } = setup(() =>
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: {
              message: 'The owner has saved a bookmark with the same URL again',
            },
          })
      )
    );

    clickRestore();

    expect(element.querySelector('.restore-notice').textContent).toContain(
      'The owner has saved a bookmark with the same URL again'
    );
  });

  it('does not restore when the confirmation is cancelled', () => {
    const { adminService, clickRestore } = setup(() => of({}), false);

    clickRestore();

    expect(adminService.restoreDeletedEntry).not.toHaveBeenCalled();
  });

  it('reloads from page 1 when a filter changes', () => {
    const { fixture, adminService } = setup(() => of({}));

    fixture.componentInstance.page = 3;
    fixture.componentInstance.action = 'delete';
    fixture.componentInstance.type = 'note';
    fixture.componentInstance.applyFilters();

    expect(adminService.getAuditLog).toHaveBeenLastCalledWith({
      action: 'delete',
      type: 'note',
      page: 1,
      limit: 25,
    });
  });
});
