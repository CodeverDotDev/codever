import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-add-snippet-bookmarklet',
  templateUrl: './add-snippet-bookmarklet.component.html',
})
export class AddSnippetBookmarkletComponent {
  @Input()
  withWindowDialog: boolean;
}
