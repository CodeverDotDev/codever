import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Snippet } from '../../core/model/snippet';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { PaginationAction } from '../../core/model/pagination-action';
import { PaginationNotificationService } from '../../core/pagination-notification.service';
import { environment } from '../../../environments/environment';

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
  paginationSize = environment.PAGINATION_PAGE_SIZE;

  Arr = Array; // Array type captured in a variable

  constructor(private router: Router, private paginationNotificationService: PaginationNotificationService, private route: ActivatedRoute) {
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

  of(snippet: Snippet) {
    return of(snippet);
  }

  navigate(page: number) {
    const paginationAction: PaginationAction = {
      caller: this.callerPagination,
      page: page
    }
    this.currentPage = page;
    this.syncPageQueryParam();
    this.paginationNotificationService.clickPageNavigation(paginationAction);
  }

  syncPageQueryParam() {
    this.router.navigate(['.'],
      {
        relativeTo: this.route,
        queryParams: {page: this.currentPage},
        queryParamsHandling: 'merge'
      }
    );
  }
}
