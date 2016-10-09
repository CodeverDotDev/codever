
import { Component, Input } from '@angular/core';
import { Bookmark } from './bookmark';

@Component({
  selector: 'my-bookmark-detail',
  templateUrl: './bookmark-detail.component.html'
})
export class BookmarkDetailComponent {
  @Input()
  bookmark: Bookmark;
}
