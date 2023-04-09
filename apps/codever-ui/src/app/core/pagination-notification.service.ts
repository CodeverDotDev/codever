import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { PaginationAction } from './model/pagination-action';

@Injectable()
export class PaginationNotificationService {
  // Observable string sources
  private pageNavigationClickedSource = new Subject<PaginationAction>();

  // Observable string streams
  pageNavigationClicked$: Observable<PaginationAction> =
    this.pageNavigationClickedSource.asObservable();

  clickPageNavigation(paginationAction: PaginationAction) {
    this.pageNavigationClickedSource.next(paginationAction);
  }
}
