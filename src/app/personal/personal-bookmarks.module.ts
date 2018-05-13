import {NgModule} from '@angular/core';
import {PersonalBookmarksListComponent} from './personal-bookmarks-list.component';
import {HttpModule} from '@angular/http';
import {ReactiveFormsModule} from '@angular/forms';
import {PersonalBookmarksRoutingModule} from './personal-bookmarks-routing.module';
import {PersonalBookmarksComponent} from './personal-bookmarks.component';
import {PersonalBookmarkSearchComponent} from './search/personal-bookmark-search.component';
import {SharedModule} from '../shared/shared.module';
import {MarkdownService} from './markdown.service';
import {AuthGuard} from './auth-guard.service';
import {RouterModule} from '@angular/router';
import {UpdatePersonalBookmarkComponent} from './update/update-personal-bookmark.component';
import {CreateNewPersonalBookmarkComponent} from './create/create-new-personal-bookmark.component';

@NgModule({
  declarations : [
    PersonalBookmarksListComponent,
    CreateNewPersonalBookmarkComponent,
    UpdatePersonalBookmarkComponent,
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
