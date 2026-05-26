import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { environment } from '../../../environments/environment';
import { Bookmark } from '../../core/model/bookmark';
import { Note } from '../../core/model/note';
import { PaginationAction } from '../../core/model/pagination-action';
import { ActivatedRoute, Router } from '@angular/router';
import { PaginationNotificationService } from '../../core/pagination-notification.service';

@Component({
  selector: 'app-page-navigation-bar',
  templateUrl: './page-navigation-bar.component.html',
  styleUrls: ['./page-navigation-bar.component.scss'],
})
export class PageNavigationBarComponent implements AfterViewInit, OnChanges {
  @Input()
  showPagination: boolean;

  @Input()
  currentPage: number;

  @Input()
  callerPagination: string;

  @Input()
  results: (Bookmark | Note)[];

  showPaginationDelayExpired = false;

  environment = environment;
  Arr = Array; // Array type captured in a variable

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paginationNotificationService: PaginationNotificationService
  ) {}

  navigate(page: number) {
    scroll(0, 0);
    const paginationAction: PaginationAction = {
      caller: this.callerPagination,
      page: page,
    };
    this.currentPage = page;
    this.paginationNotificationService.clickPageNavigation(paginationAction);
    this.syncPageQueryParam();
  }

  syncPageQueryParam() {
    this.router.navigate(['.'], {
      relativeTo: this.route,
      queryParams: { page: this.currentPage },
      queryParamsHandling: 'merge',
    });
  }

  ngAfterViewInit(): void {
    // delay showing pagination buttons with 1 second
    if (this.currentPage === 1) {
      setTimeout(() => (this.showPaginationDelayExpired = true), 1000);
    } else {
      setTimeout(() => (this.showPaginationDelayExpired = true), 0);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // When parent explicitly provides a currentPage > 1, use it
    if (changes['currentPage'] && changes['currentPage'].currentValue > 1) {
      this.currentPage = changes['currentPage'].currentValue;
    } else if (changes['callerPagination']) {
      // On first initialization, read from route snapshot
      const page = this.route.snapshot.queryParamMap.get('page');
      if (page) {
        this.currentPage = parseInt(page, 10);
      } else {
        this.currentPage = 1;
      }
    }
  }
}
