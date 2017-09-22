import {Component, Input} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Bookmark} from '../../../core/model/bookmark';

@Component({
  selector: 'my-async-public-bookmark-list',
  templateUrl: './async-public-bookmark-list.component.html',
  styleUrls: ['./async-public-bookmark-list.component.scss']
})
export class AsyncPublicBookmarksListComponent {

  @Input()
  bookmarks: Observable<Bookmark[]>;

  @Input()
  queryText: string;

  constructor() {}

}
