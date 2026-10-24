import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Search } from '../../../../core/model/user-data';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelContent,
} from '@angular/material/expansion';
import { RouterLink } from '@angular/router';
import { SearchFilterPipe } from '../../../../shared/pipe/search-filter.pipe';

@Component({
  selector: 'app-my-searches-template',
  templateUrl: './my-searches-template.component.html',
  styleUrls: ['./my-searches-template.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelContent,
    RouterLink,
    SearchFilterPipe,
  ],
})
export class MySearchesTemplateComponent {
  @Input()
  searches: Search[];

  @Input()
  showCount = false;

  @Input()
  type: string;
}
