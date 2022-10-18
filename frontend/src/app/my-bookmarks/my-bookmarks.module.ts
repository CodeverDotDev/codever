import { NgModule } from '@angular/core';
import { MyBookmarksRoutingModule } from './my-bookmarks-routing.module';
import { MyBookmarksEntryPointComponent } from './my-bookmarks-entry-point.component';
import { SharedModule } from '../shared/shared.module';
import { RouterModule } from '@angular/router';
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


@NgModule({
    declarations: [
        CreatePersonalBookmarkComponent,
        UpdatePersonalBookmarkComponent,
        CopyToMineBookmarkComponent,
        MyBookmarksEntryPointComponent,
        PublicBookmarkPresentDialogComponent,
        SaveBookmarkFormComponent,
        BookmarkDetailsComponent
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
        MyBookmarksRoutingModule
    ],
    providers: [
        DatePipe
    ]
})
export class MyBookmarksModule {}
