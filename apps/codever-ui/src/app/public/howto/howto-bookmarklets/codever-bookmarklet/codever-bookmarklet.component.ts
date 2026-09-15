import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-codever-bookmarklet',
  templateUrl: './codever-bookmarklet.component.html',
  styleUrls: ['./codever-bookmarklet.component.scss'],
})
export class CodeverBookmarkletComponent {
  @Input()
  withWindowDialog: boolean;
}
