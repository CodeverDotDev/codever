import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { MatIconModule } from '@angular/material/icon';
import { AuthGuard } from '../core/auth/auth-guard.service';
import { AssistantComponent } from './assistant.component';
import { ReferenceCardComponent } from './reference-card/reference-card.component';
import { AssistantService } from './assistant.service';

const assistantRoutes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    component: AssistantComponent,
  },
];

@NgModule({
  imports: [
    RouterModule.forChild(assistantRoutes),
    SharedModule,
    MatIconModule,
    AssistantComponent,
    ReferenceCardComponent,
  ],
  providers: [AssistantService],
})
export class AssistantModule {}
