import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchResultsPageComponent } from './search-results-page.component';

import { RouterModule, Routes } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { FindElsewhereComponent } from './find-elsewhere/find-elsewhere.component';

const searchResultsRoutes: Routes = [
  {
    path: '',
    component: SearchResultsPageComponent,
  },
];

@NgModule({
  imports: [
    RouterModule.forChild(searchResultsRoutes),
    CommonModule,
    MatTabsModule,
    SearchResultsPageComponent,
    FindElsewhereComponent,
  ],
})
export class SearchResultsModule {}
