import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../core/admin/admin.service';
import {
  AdminOverview,
  AdminWindowCounts,
} from '../../core/admin/admin.model';

type WindowKey = keyof AdminOverview['counts'];

/** Recent platform activity. Private entries appear only as totals. */
@Component({
  selector: 'app-admin-overview',
  templateUrl: './admin-overview.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterLink, DatePipe],
})
export class AdminOverviewComponent implements OnInit {
  readonly windows: { key: WindowKey; label: string }[] = [
    { key: 'last24h', label: 'Last 24 hours' },
    { key: 'last7d', label: 'Last 7 days' },
    { key: 'last30d', label: 'Last 30 days' },
  ];

  overview: AdminOverview;
  loading = false;
  errorMessage: string;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = undefined;
    this.adminService.getOverview().subscribe({
      next: (overview) => {
        this.overview = overview;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'The overview could not be loaded.';
      },
    });
  }

  counts(key: WindowKey): AdminWindowCounts {
    return this.overview.counts[key];
  }
}
