import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-find-elsewhere',
  templateUrl: './find-elsewhere.component.html',
  styleUrls: ['./find-elsewhere.component.scss'],
})
export class FindElsewhereComponent {
  @Input()
  searchText: any;
}
