import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

vi.mock('izitoast', () => ({
  default: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

import { AdminPublicContentComponent } from './admin-public-content.component';
import { AdminService } from '../../core/admin/admin.service';
import { AdminPublicEntry } from '../../core/admin/admin.model';

const entry = (type: 'bookmark' | 'note', id: string): AdminPublicEntry => ({
  type,
  id,
  title: `${type} ${id}`,
  location: type === 'bookmark' ? `https://${id}.example` : undefined,
  tags: ['spam'],
  ownerId: 'owner-1',
  ownerDisplayName: 'Owner',
  createdAt: '2026-11-21T10:00:00Z',
});

const setup = (confirmed: boolean) => {
  const adminService = {
    getPublicEntries: vi.fn(() =>
      of([entry('bookmark', 'b1'), entry('note', 'n1'), entry('bookmark', 'b2')])
    ),
    unpublishEntry: vi.fn(() => of({})),
    deleteEntry: vi.fn(() => of(null)),
    bulkModerate: vi.fn(() =>
      of({
        succeeded: [{ type: 'bookmark', id: 'b1' }],
        failed: [{ type: 'note', id: 'n1', reason: 'not found' }],
      })
    ),
  };
  const dialog = {
    open: vi.fn(() => ({ afterClosed: () => of(confirmed) })),
  };
  TestBed.configureTestingModule({
    imports: [AdminPublicContentComponent],
    providers: [
      provideRouter([]),
      { provide: AdminService, useValue: adminService },
      { provide: MatDialog, useValue: dialog },
    ],
  });
  const fixture = TestBed.createComponent(AdminPublicContentComponent);
  fixture.detectChanges();
  const element = fixture.nativeElement as HTMLElement;
  const click = (selector: string, index = 0) => {
    (element.querySelectorAll(selector)[index] as HTMLElement).click();
    fixture.detectChanges();
  };
  const rows = () => element.querySelectorAll('tr.public-entry');
  return { fixture, element, adminService, dialog, click, rows };
};

describe('AdminPublicContentComponent', () => {
  it('lists the latest public entries with title, URL and owner', () => {
    const { adminService, rows, element } = setup(true);

    expect(adminService.getPublicEntries).toHaveBeenCalledWith({
      q: '',
      type: 'all',
      userId: '',
      page: 1,
      limit: 25,
    });
    expect(rows()).toHaveLength(3);
    expect(element.textContent).toContain('https://b1.example');
    expect(element.textContent).toContain('Owner');
  });

  it('deletes one entry after confirmation and removes it in place', () => {
    const { adminService, dialog, click, rows } = setup(true);

    click('button.delete-entry', 0);

    expect(dialog.open).toHaveBeenCalledTimes(1);
    expect(adminService.deleteEntry).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'bookmark', id: 'b1' })
    );
    expect(rows()).toHaveLength(2);
    expect(adminService.getPublicEntries).toHaveBeenCalledTimes(1);
  });

  it('changes nothing when the confirmation is cancelled', () => {
    const { adminService, click, rows } = setup(false);

    click('button.unpublish-entry', 1);
    click('input.select-entry', 0);
    click('button.bulk-delete');

    expect(adminService.unpublishEntry).not.toHaveBeenCalled();
    expect(adminService.bulkModerate).not.toHaveBeenCalled();
    expect(rows()).toHaveLength(3);
  });

  it('bulk deletes the selection once and reports the failed entries', () => {
    const { adminService, dialog, click, rows, element } = setup(true);

    click('input.select-entry', 0);
    click('input.select-entry', 1);
    click('button.bulk-delete');

    expect(dialog.open).toHaveBeenCalledTimes(1);
    const [, config] = dialog.open.mock.calls[0] as unknown as [
      unknown,
      { data: { title: string } },
    ];
    expect(config.data.title).toBe('Delete 2 entries');
    expect(adminService.bulkModerate).toHaveBeenCalledWith('delete', [
      expect.objectContaining({ type: 'bookmark', id: 'b1' }),
      expect.objectContaining({ type: 'note', id: 'n1' }),
    ]);
    expect(rows()).toHaveLength(2);
    const failures = element.querySelector('.failed-entries').textContent;
    expect(failures).toContain('note n1');
    expect(failures).toContain('not found');
  });

  it('applies the search filters through the URL', () => {
    const { fixture } = setup(true);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.q = 'casino';
    fixture.componentInstance.type = 'note';
    fixture.componentInstance.search();

    const [commands, extras] = navigate.mock.calls[0];
    expect(commands).toEqual([]);
    expect(extras.queryParams).toEqual({
      q: 'casino',
      type: 'note',
      userId: null,
      page: null,
    });
  });
});
