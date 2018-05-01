import {NgModule} from '@angular/core';
import {PersonalBookmarksListComponent} from './personal-bookmarks-list.component';
import {HttpModule} from '@angular/http';
import {ReactiveFormsModule} from '@angular/forms';
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
    PersonalBookmarkDetailComponent,
    PersonalBookmarksComponent,
    PersonalBookmarkSearchComponent
  ],
  imports: [
    SharedModule,
    RouterModule,
    HttpModule,
    ReactiveFormsModule,
    PersonalBookmarksRoutingModule
  ],
  providers: [
    MarkdownService,
    AuthGuard
  ]
})
export class PersonalBookmarksModule {}
