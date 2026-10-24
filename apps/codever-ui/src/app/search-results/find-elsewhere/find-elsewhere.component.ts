import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-find-elsewhere',
  templateUrl: './find-elsewhere.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./find-elsewhere.component.scss'],
})
export class FindElsewhereComponent {
  @Input()
  searchText: any;
}
