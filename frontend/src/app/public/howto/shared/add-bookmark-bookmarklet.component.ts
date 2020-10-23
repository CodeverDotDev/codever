import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-add-bookmark-bookmarklet',
  templateUrl: './add-bookmark-bookmarklet.component.html',
})
export class AddBookmarkBookmarkletComponent {
  @Input()
  withWindowDialog: boolean;
}
