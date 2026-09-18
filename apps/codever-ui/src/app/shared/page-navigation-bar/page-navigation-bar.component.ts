import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { environment } from '../../../environments/environment';
import { Bookmark } from '../../core/model/bookmark';
import { Note } from '../../core/model/note';
import { PaginationAction } from '../../core/model/pagination-action';
import { ActivatedRoute, Router } from '@angular/router';
import { PaginationNotificationService } from '../../core/pagination-notification.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-page-navigation-bar',
  templateUrl: './page-navigation-bar.component.html',
  styleUrls: ['./page-navigation-bar.component.scss'],
  imports: [NgClass],
})
export class PageNavigationBarComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input()
  showPagination: boolean;

  @Input()
  currentPage: number;

  @Input()
  callerPagination: string;

  @Input()
  results: (Bookmark | Note)[];

  showPaginationDelayExpired = false;
  private visibilityTimer: ReturnType<typeof setTimeout>;
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

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
    // Read the current type filter from the real URL (it may have been set via
    // Location.replaceState, which doesn't update the router's internal state).
    // We must always explicitly set `type` so the router's stale value is overridden:
    //   - present in URL  → carry it forward
    //   - absent from URL → set to null so the router removes any stale value
    const urlParams = new URLSearchParams(window.location.search);
    const typeFilter = urlParams.get('type');

    this.router.navigate(['.'], {
      relativeTo: this.route,
      queryParams: {
        page: this.currentPage,
        type: typeFilter || null,
      },
      queryParamsHandling: 'merge',
    });
  }

  ngAfterViewInit(): void {
    // delay showing pagination buttons with 1 second
    this.visibilityTimer = setTimeout(
      () => {
        this.showPaginationDelayExpired = true;
        this.changeDetectorRef.markForCheck();
      },
      this.currentPage === 1 ? 1000 : 0
    );
  }

  ngOnDestroy(): void {
    clearTimeout(this.visibilityTimer);
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
