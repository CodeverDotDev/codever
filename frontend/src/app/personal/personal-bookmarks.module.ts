import { NgModule } from '@angular/core';
import { PersonalBookmarksRoutingModule } from './personal-bookmarks-routing.module';
import { PersonalBookmarksComponent } from './personal-bookmarks.component';
import { SharedModule } from '../shared/shared.module';
import { MarkdownService } from './markdown.service';
import { RouterModule } from '@angular/router';
import { UpdatePersonalBookmarkComponent } from './update/update-personal-bookmark.component';
import { CreatePersonalBookmarkComponent } from './create/create-personal-bookmark.component';
import {
  MatAutocompleteModule,
  MatChipsModule,
  MatDialogModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatTabsModule
} from '@angular/material';
import { OverlayModule } from '@angular/cdk/overlay';
import { PublicBookmarkPresentDialogComponent } from './save-bookmark-form/public-bookmark-present-dialog/public-bookmark-present-dialog.component';
import { SaveBookmarkFormComponent } from './save-bookmark-form/save-bookmark-form.component';
import { CopyToMineBookmarkComponent } from './copy-to-mine/copy-to-mine-bookmark.component';
import { DatePipe } from '@angular/common';


@NgModule({
  declarations : [
    CreatePersonalBookmarkComponent,
    UpdatePersonalBookmarkComponent,
    CopyToMineBookmarkComponent,
    PersonalBookmarksComponent,
    PublicBookmarkPresentDialogComponent,
    SaveBookmarkFormComponent
  ],
  imports: [
    SharedModule,
    RouterModule,
    OverlayModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatAutocompleteModule,
    MatTabsModule,
    MatDialogModule,
    PersonalBookmarksRoutingModule
  ],
  providers: [
    MarkdownService,
    DatePipe
  ],
  entryComponents: [
    PublicBookmarkPresentDialogComponent
  ]
})
export class PersonalBookmarksModule {}
