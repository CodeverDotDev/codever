import { describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AdminOverviewComponent } from './admin-overview.component';
import { AdminService } from '../../core/admin/admin.service';
import { AdminOverview } from '../../core/admin/admin.model';

const window = (users: number, privateNotes: number) => ({
  users,
  bookmarks: { public: 2, private: 3 },
  notes: { public: 1, private: privateNotes },
});

const overview: AdminOverview = {
  generatedAt: '2026-11-21T12:00:00Z',
  counts: {
    last24h: window(3, 4),
    last7d: window(10, 40),
    last30d: window(30, 400),
  },
  topTags: [{ tag: 'casino', count: 7 }],
  mostActiveUsers: [
    { userId: 'spammer-id', displayName: 'Spammer', publicEntries: 40 },
  ],
};

const render = (getOverview: () => unknown) => {
  TestBed.configureTestingModule({
    imports: [AdminOverviewComponent],
    providers: [
      provideRouter([]),
      { provide: AdminService, useValue: { getOverview: vi.fn(getOverview) } },
    ],
  });
  const fixture = TestBed.createComponent(AdminOverviewComponent);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
};

describe('AdminOverviewComponent', () => {
  it('shows window counts with private totals, top tags and active users', () => {
    const element = render(() => of(overview));

    const rows = Array.from(
      element.querySelectorAll('table.overview-counts tbody tr')
    ).map((row) =>
      Array.from(row.querySelectorAll('th, td')).map((cell) =>
        cell.textContent.trim()
      )
    );
    expect(rows).toEqual([
      ['Last 24 hours', '3', '2', '3', '1', '4'],
      ['Last 7 days', '10', '2', '3', '1', '40'],
      ['Last 30 days', '30', '2', '3', '1', '400'],
    ]);
    expect(element.querySelector('.top-tags').textContent).toContain('casino');
    expect(element.querySelector('.top-tags').textContent).toContain('7');
    const activeUser = element.querySelector('.most-active-users a');
    expect(activeUser.textContent).toContain('Spammer');
    expect(activeUser.getAttribute('href')).toContain('userId=spammer-id');
  });

  it('reports a loading failure', () => {
    const element = render(() => throwError(() => new Error('down')));

    expect(element.textContent).toContain('The overview could not be loaded.');
  });
});
