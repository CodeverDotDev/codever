import {NgModule} from '@angular/core';
import {PersonalCodingmarksListComponent} from './personal-codingmarks-list.component';
import {PersonalCodingmarksRoutingModule} from './personal-codingmarks-routing.module';
import {PersonalCodingmarksComponent} from './personal-codingmarks.component';
import {SharedModule} from '../shared/shared.module';
import {MarkdownService} from './markdown.service';
import {AuthGuard} from './auth-guard.service';
import {RouterModule} from '@angular/router';
import {UpdatePersonalCodingmarkComponent} from './update/update-personal-codingmark.component';
import {CreatePersonalCodingmarkComponent} from './create/create-personal-codingmark.component';
import {
  MatAutocompleteModule, MatChipsModule, MatFormFieldModule, MatIconModule,
  MatInputModule, MatTabsModule
} from '@angular/material';
import {OverlayModule} from '@angular/cdk/overlay';
import {PublicBookmarksRoutingModule} from '../public/public-routing.module';


@NgModule({
  declarations : [
    PersonalCodingmarksListComponent,
    CreatePersonalCodingmarkComponent,
    UpdatePersonalCodingmarkComponent,
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
    MatTabsModule,
    PersonalCodingmarksRoutingModule
  ],
  providers: [
    MarkdownService,
    AuthGuard
  ]
})
export class PersonalCodingmarksModule {}
