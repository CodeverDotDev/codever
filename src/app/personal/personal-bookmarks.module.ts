import {NgModule} from '@angular/core';
import {PersonalBookmarksListComponent} from './personal-bookmarks-list.component';
import {PersonalBookmarksRoutingModule} from './personal-bookmarks-routing.module';
import {PersonalBookmarksComponent} from './personal-bookmarks.component';
import {SharedModule} from '../shared/shared.module';
import {MarkdownService} from './markdown.service';
import {AuthGuard} from './auth-guard.service';
import {RouterModule} from '@angular/router';
import {UpdatePersonalCodingmarkComponent} from './update/update-personal-codingmark.component';
import {CreatePersonalBookmarkComponent} from './create/create-personal-bookmark.component';
import {
  MatAutocompleteModule, MatChipsModule, MatFormFieldModule, MatIconModule,
  MatInputModule, MatTabsModule
} from '@angular/material';
import {OverlayModule} from '@angular/cdk/overlay';
import {PublicBookmarksRoutingModule} from '../public/public-routing.module';


@NgModule({
  declarations : [
    PersonalBookmarksListComponent,
    CreatePersonalBookmarkComponent,
    UpdatePersonalCodingmarkComponent,
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
    MatTabsModule,
    PersonalBookmarksRoutingModule
  ],
  providers: [
    MarkdownService,
    AuthGuard
  ]
})
export class PersonalBookmarksModule {}
