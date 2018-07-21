import {NgModule} from '@angular/core';
import {PersonalBookmarksListComponent} from './personal-bookmarks-list.component';
import {PersonalBookmarksRoutingModule} from './personal-bookmarks-routing.module';
import {PersonalBookmarksComponent} from './personal-bookmarks.component';
import {SharedModule} from '../shared/shared.module';
import {MarkdownService} from './markdown.service';
import {AuthGuard} from './auth-guard.service';
import {RouterModule} from '@angular/router';
import {UpdatePersonalBookmarkComponent} from './update/update-personal-bookmark.component';
import {CreateNewPersonalBookmarkComponent} from './create/create-new-personal-bookmark.component';
import {
  MatAutocompleteModule, MatChipsModule, MatFormFieldModule, MatIconModule,
  MatInputModule
} from '@angular/material';
import {OverlayModule} from '@angular/cdk/overlay';


@NgModule({
  declarations : [
    PersonalBookmarksListComponent,
    CreateNewPersonalBookmarkComponent,
    UpdatePersonalBookmarkComponent,
    PersonalBookmarksComponent
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
    PersonalBookmarksRoutingModule
  ],
  providers: [
    MarkdownService,
    AuthGuard
  ]
})
export class PersonalBookmarksModule {}
