import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { UserSettingsComponent } from './user-settings.component';
import { AuthGuard } from '../../core/auth/auth-guard.service';
import { CoreModule } from 'keycloak-angular';
import { MatTabsModule } from '@angular/material/tabs';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { ImageUploadService } from './user-profile/image-upload.service';
import { UserFeedComponent } from './user-feed/user-feed.component';
import { MatRadioModule } from '@angular/material/radio';
import { UserLocalStorageSetupComponent } from './local-storage/user-local-storage-setup.component';


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
    UserProfileComponent,
    UserFeedComponent,
    UserLocalStorageSetupComponent,
  ],
  imports: [
    RouterModule.forChild(userSettingsRoutes),
    ReactiveFormsModule,
    SharedModule,
    CoreModule,
    CommonModule,
    MatTabsModule,
    MatRadioModule,
  ],
  providers: [
    ImageUploadService
  ]
})
export class UserSettingsModule {
}
