import { NgModule } from '@angular/core';
import { MyBookmarksEntryPointComponent } from './my-bookmarks-entry-point.component';

import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../core/auth/auth-guard.service';
import { UpdatePersonalBookmarkComponent } from './update/update-personal-bookmark.component';
import { CreatePersonalBookmarkComponent } from './create/create-personal-bookmark.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { PublicBookmarkPresentDialogComponent } from './save-bookmark-form/public-bookmark-present-dialog/public-bookmark-present-dialog.component';
import { SaveBookmarkFormComponent } from './save-bookmark-form/save-bookmark-form.component';
import { CopyToMineBookmarkComponent } from './copy-to-mine/copy-to-mine-bookmark.component';
import { DatePipe } from '@angular/common';
import { BookmarkDetailsComponent } from './bookmark-details/bookmark-details.component';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { CloneBookmarkComponent } from './clone-bookmark/clone-bookmark.component';
import { AiRefineBookmarkDialogComponent } from './save-bookmark-form/ai-refine-bookmark-dialog/ai-refine-bookmark-dialog.component';

const myBookmarksRoutes: Routes = [
  {
    path: '',
    component: MyBookmarksEntryPointComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'new', component: CreatePersonalBookmarkComponent },
      { path: ':id/copy-to-mine', component: CopyToMineBookmarkComponent },
      { path: ':id/clone', component: CloneBookmarkComponent },
      { path: ':id/details', component: BookmarkDetailsComponent },
      { path: ':id/edit', component: UpdatePersonalBookmarkComponent },
    ],
  },
];

@NgModule({
  imports: [
    RouterModule,
    OverlayModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatAutocompleteModule,
    MatTabsModule,
    MatDialogModule,
    RouterModule.forChild(myBookmarksRoutes),
    CreatePersonalBookmarkComponent,
    UpdatePersonalBookmarkComponent,
    CopyToMineBookmarkComponent,
    CloneBookmarkComponent,
    AiRefineBookmarkDialogComponent,
    MyBookmarksEntryPointComponent,
    PublicBookmarkPresentDialogComponent,
    SaveBookmarkFormComponent,
    BookmarkDetailsComponent,
  ],
  providers: [DatePipe],
})
export class MyBookmarksModule {}
