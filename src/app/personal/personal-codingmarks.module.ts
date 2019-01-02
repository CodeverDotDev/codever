import {NgModule} from '@angular/core';
import {PersonalCodingmarksListComponent} from './personal-codingmarks-list.component';
import {PersonalCodingmarksRoutingModule} from './personal-codingmarks-routing.module';
import {PersonalCodingmarksComponent} from './personal-codingmarks.component';
import {SharedModule} from '../shared/shared.module';
import {MarkdownService} from './markdown.service';
import {AuthGuard} from './auth-guard.service';
import {RouterModule} from '@angular/router';
import {UpdatePersonalBookmarkComponent} from './update/update-personal-bookmark.component';
import {CreatePersonalCodingmarkComponent} from './create/create-personal-codingmark.component';
import {
  MatAutocompleteModule, MatChipsModule, MatFormFieldModule, MatIconModule,
  MatInputModule
} from '@angular/material';
import {OverlayModule} from '@angular/cdk/overlay';


@NgModule({
  declarations : [
    PersonalCodingmarksListComponent,
    CreatePersonalCodingmarkComponent,
    UpdatePersonalBookmarkComponent,
    PersonalCodingmarksComponent
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
    PersonalCodingmarksRoutingModule
  ],
  providers: [
    MarkdownService,
    AuthGuard
  ]
})
export class PersonalCodingmarksModule {}
