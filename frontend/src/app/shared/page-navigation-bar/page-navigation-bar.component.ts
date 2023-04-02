import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { environment } from '../../../environments/environment';
import { Bookmark } from '../../core/model/bookmark';
import { Snippet } from '../../core/model/snippet';
import { PaginationAction } from '../../core/model/pagination-action';
import { ActivatedRoute, Router } from '@angular/router';
import { PaginationNotificationService } from '../../core/pagination-notification.service';
import { Note } from '../../core/model/note';

@Component({
  selector: 'app-page-navigation-bar',
  templateUrl: './page-navigation-bar.component.html',
  styleUrls: ['./page-navigation-bar.component.scss'],
})
export class PageNavigationBarComponent
  implements OnInit, AfterViewInit, OnChanges
{
  @Input()
  showPagination: boolean;

  @Input()
  currentPage: number;

  @Input()
  callerPagination: string;

  @Input()
  results: (Bookmark | Snippet | Note)[];

  showPaginationDelayExpired = false;

  environment = environment;
  Arr = Array; // Array type captured in a variable

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paginationNotificationService: PaginationNotificationService
  ) {}

  ngOnInit() {}

  navigate(page: number) {
    scroll(0, 0);
    const paginationAction: PaginationAction = {
      caller: this.callerPagination,
      page: page,
    };
    this.currentPage = page;
    this.syncPageQueryParam();
    this.paginationNotificationService.clickPageNavigation(paginationAction);
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
    const page = this.route.snapshot.queryParamMap.get('page');
    if (page) {
      this.currentPage = parseInt(page, 0);
    } else {
      this.currentPage = 1;
    }
  }
}
