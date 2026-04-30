import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchResultsPageComponent } from './search-results-page.component';
import { MySnippetsModule } from '../my-snippets/my-snippets.module';
import { SharedModule } from '../shared/shared.module';
import { RouterModule, Routes } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { FindElsewhereComponent } from './find-elsewhere/find-elsewhere.component';
import { PublicNotesService } from '../public/notes/public-notes.service';

const searchResultsRoutes: Routes = [
  {
    path: '',
    component: SearchResultsPageComponent,
  },
];

@NgModule({
  declarations: [SearchResultsPageComponent, FindElsewhereComponent],
  imports: [
    RouterModule.forChild(searchResultsRoutes),
    CommonModule,
    MySnippetsModule,
    SharedModule,
    MatTabsModule,
  ],
  providers: [PublicNotesService],
})
export class SearchResultsModule {}
