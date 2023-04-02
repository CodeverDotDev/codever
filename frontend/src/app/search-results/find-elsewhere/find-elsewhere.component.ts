import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-find-elsewhere',
  templateUrl: './find-elsewhere.component.html',
  styleUrls: ['./find-elsewhere.component.scss'],
})
export class FindElsewhereComponent implements OnInit {
  @Input()
  searchText: any;

  constructor() {}

  ngOnInit(): void {}
}
