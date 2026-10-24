import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-codever-bookmarklet',
  templateUrl: './codever-bookmarklet.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./codever-bookmarklet.component.scss'],
})
export class CodeverBookmarkletComponent {
  @Input()
  withWindowDialog: boolean;
}
