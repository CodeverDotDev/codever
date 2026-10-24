import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { SharedBookmark } from '../../../core/model/share-link';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { EMPTY, Observable, Subject, combineLatest } from 'rxjs';
import { catchError, startWith, switchMap, tap } from 'rxjs/operators';
import { PublicBookmarksService } from '../public-bookmarks.service';
import { BookmarkTextComponent } from '../../../shared/bookmark-text/bookmark-text.component';
import { AsyncPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-bookmark-details',
  templateUrl: './shareable-bookmark-details.component.html',
  styleUrls: ['./shareable-bookmark-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [BookmarkTextComponent, AsyncPipe, DatePipe],
})
export class ShareableBookmarkDetailsComponent implements OnInit {
  bookmark$: Observable<SharedBookmark>;
  loadState: 'loading' | 'loaded' | 'unavailable' | 'error' = 'loading';
  private readonly retry$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private publicBookmarksService: PublicBookmarksService
  ) {}

  ngOnInit() {
    this.bookmark$ = combineLatest([
      this.route.paramMap,
      this.retry$.pipe(startWith(undefined)),
    ]).pipe(
      switchMap(([params]) => {
        const token = params.get('token');
        this.loadState = 'loading';
        if (!token) {
          this.loadState = 'unavailable';
          return EMPTY;
        }
        return this.publicBookmarksService
          .getSharedBookmarkByToken(token)
          .pipe(
            tap(() => (this.loadState = 'loaded')),
            catchError((error: unknown) => {
              this.loadState =
                error instanceof HttpErrorResponse && error.status === 404
                  ? 'unavailable'
                  : 'error';
              return EMPTY;
            })
          );
      })
    );
  }

  retry(): void {
    this.retry$.next();
  }
}
