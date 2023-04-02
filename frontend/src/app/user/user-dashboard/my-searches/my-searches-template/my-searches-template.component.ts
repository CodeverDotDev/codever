import { Component, Input, OnInit } from '@angular/core';
import { Search } from '../../../../core/model/user-data';

@Component({
  selector: 'app-my-searches-template',
  templateUrl: './my-searches-template.component.html',
  styleUrls: ['./my-searches-template.component.scss'],
})
export class MySearchesTemplateComponent implements OnInit {
  @Input()
  searches: Search[];

  @Input()
  showCount = false;

  @Input()
  type: string;

  constructor() {}

  ngOnInit(): void {}
}
