import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/** Shell of the admin dashboard at /admin with its three areas as tabs. */
@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
})
export class AdminDashboardComponent {
  readonly tabs = [
    { path: 'overview', label: 'Overview', icon: 'fas fa-chart-line' },
    { path: 'public-content', label: 'Public content', icon: 'fas fa-globe' },
    { path: 'audit-log', label: 'Audit log', icon: 'fas fa-history' },
  ];
}
