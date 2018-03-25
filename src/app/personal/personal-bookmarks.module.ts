import {NgModule} from '@angular/core';
import {PersonalBookmarksListComponent} from './personal-bookmarks-list.component';
import {AsyncUserBookmarksListComponent} from './async-list/async-personal-bookmark-list.component';
import {HttpModule} from '@angular/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {PersonalBookmarksStore} from '../core/store/PersonalBookmarksStore';
import {PersonalBookmarksService} from '../core/personal-bookmarks.service';
import {CommonModule} from '@angular/common';
import {PersonalBookmarksRoutingModule} from './personal-bookmarks-routing.module';
import {NewPersonalBookmarkFormComponent} from './new-personal-bookmark/new-personal-bookmark-form.component';
import {PersonalBookmarkDetailComponent} from './detail/personal-bookmark-detail.component';
import {PersonalBookmarksComponent} from './personal-bookmarks.component';
import {PersonalBookmarkSearchComponent} from './search/personal-bookmark-search.component';
import {SharedModule} from '../shared/shared.module';
import {MarkdownService} from './markdown.service';
import {AuthGuard} from './auth-guard.service';
import {RouterModule} from '@angular/router';

@NgModule({
  declarations : [
    PersonalBookmarksListComponent,
    NewPersonalBookmarkFormComponent,
    AsyncUserBookmarksListComponent,
    PersonalBookmarkDetailComponent,
    PersonalBookmarksComponent,
    PersonalBookmarkSearchComponent
  ],
  imports: [
    SharedModule,
    CommonModule, // in the root module comes via the BrowserModule
    RouterModule,
    HttpModule,
    FormsModule,
    ReactiveFormsModule,
    PersonalBookmarksRoutingModule
  ],
  providers: [
    MarkdownService,
    AuthGuard
  ]
})
export class PersonalBookmarksModule {}
