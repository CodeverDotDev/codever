import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';

import { AuthGuard } from '../core/auth/auth-guard.service';
import { PersonalCollectionsService } from '../core/personal-collections.service';
import { MyCollectionsPageComponent } from './my-collections-page.component';
import { CollectionDetailComponent } from './collection-detail/collection-detail.component';
import { CollectionFormDialogComponent } from './collection-form-dialog/collection-form-dialog.component';

const collectionsRoutes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    component: MyCollectionsPageComponent,
  },
  {
    path: ':collectionId',
    canActivate: [AuthGuard],
    component: CollectionDetailComponent,
  },
];

@NgModule({
  declarations: [
    MyCollectionsPageComponent,
    CollectionDetailComponent,
    CollectionFormDialogComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    RouterModule.forChild(collectionsRoutes),
  ],
  providers: [PersonalCollectionsService],
})
export class MyCollectionsModule {}

