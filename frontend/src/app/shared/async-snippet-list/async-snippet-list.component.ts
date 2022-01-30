import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Snippet } from '../../core/model/snippet';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Bookmark } from '../../core/model/bookmark';

@Component({
  selector: 'app-async-snippet-list',
  templateUrl: './async-snippet-list.component.html',
  styleUrls: ['./async-snippet-list.component.scss']
})
export class AsyncSnippetListComponent implements OnInit, OnChanges {

  @Input()
  snippets$: Observable<Snippet[]>;

  @Input()
  queryText: string; // used for highlighting search terms in the bookmarks list

  @Input()
  callerPagination: string;

  @Input()
  showPagination = true;

  currentPage = 1;

  constructor(private route: ActivatedRoute) {
  }

  ngOnInit() {

  }

  ngOnChanges(changes: SimpleChanges): void {
    const page = this.route.snapshot.queryParamMap.get('page');
    if (page) {
      this.currentPage = parseInt(page, 0);
    } else {
      this.currentPage = 1;
    }
  }

  of(searchResult: Snippet | Bookmark) {
    return of(searchResult);
  }

}
