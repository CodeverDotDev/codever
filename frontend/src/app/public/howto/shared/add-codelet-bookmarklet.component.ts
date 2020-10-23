import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-add-codelet-bookmarklet',
  templateUrl: './add-codelet-bookmarklet.component.html',
})
export class AddCodeletBookmarkletComponent {
  @Input()
  withWindowDialog: boolean;
}
