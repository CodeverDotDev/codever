import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-codever-bookmarklet',
  templateUrl: './codever-bookmarklet.component.html',
})
export class CodeverBookmarkletComponent {
  @Input()
  withWindowDialog: boolean;
}
