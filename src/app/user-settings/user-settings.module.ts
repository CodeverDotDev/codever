import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { UserSettingsComponent } from './user-settings.component';
import { AuthGuard } from '../core/auth/auth-guard.service';
import { CoreModule } from 'keycloak-angular';
import { MatTabsModule } from '@angular/material';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { FileUploadModule } from 'ng2-file-upload';
import { ImageUploadService } from './user-profile/image-upload.service';


const userSettingsRoutes: Routes = [
  {
    path: '',
    component: UserSettingsComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  declarations: [
    UserSettingsComponent,
    UserProfileComponent
  ],
  imports: [
    RouterModule.forChild(userSettingsRoutes),
    ReactiveFormsModule,
    SharedModule,
    CoreModule,
    CommonModule,
    MatTabsModule,
    FileUploadModule
  ],
  providers: [
    ImageUploadService
  ]
})
export class UserSettingsModule {
}
