import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';

import { AuthGuard } from '../core/auth/auth-guard.service';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminOverviewComponent } from './admin-overview/admin-overview.component';
import { AdminPublicContentComponent } from './admin-public-content/admin-public-content.component';
import { AdminAuditLogComponent } from './admin-audit-log/admin-audit-log.component';

export const ADMIN_ROLE = 'ROLE_ADMIN';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: [ADMIN_ROLE] },
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: AdminOverviewComponent },
      { path: 'public-content', component: AdminPublicContentComponent },
      { path: 'audit-log', component: AdminAuditLogComponent },
    ],
  },
];

@NgModule({
  imports: [
    MatDialogModule,
    RouterModule.forChild(adminRoutes),
    AdminDashboardComponent,
  ],
})
export class AdminModule {}
