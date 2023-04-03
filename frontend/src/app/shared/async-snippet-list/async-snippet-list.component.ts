import { Component, Input } from '@angular/core';
import { Snippet } from '../../core/model/snippet';
import { Observable, of } from 'rxjs';
import { Bookmark } from '../../core/model/bookmark';

@Component({
  selector: 'app-async-snippet-list',
  templateUrl: './async-snippet-list.component.html',
  styleUrls: ['./async-snippet-list.component.scss'],
})
export class AsyncSnippetListComponent {
  @Input()
  snippets$: Observable<Snippet[]>;

  @Input()
  queryText: string; // used for highlighting search terms in the bookmarks list

  @Input()
  callerPagination: string;

  @Input()
  showPagination = true;

  currentPage = 1;

  of(searchResult: Snippet | Bookmark) {
    return of(searchResult);
  }
}
