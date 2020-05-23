import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchResultsComponent } from './search-results.component';
import { CodeletModule } from '../codelet/codelet.module';
import { SharedModule } from '../shared/shared.module';
import { RouterModule, Routes } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';

const searchResultsRoutes: Routes = [
  {
    path: '',
    component: SearchResultsComponent
  }
];

@NgModule({
  declarations: [SearchResultsComponent],
  imports: [
    RouterModule.forChild(searchResultsRoutes),
    CommonModule,
    CodeletModule,
    SharedModule,
    MatTabsModule,
  ]
})
export class SearchResultsModule { }
