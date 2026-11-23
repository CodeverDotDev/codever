import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { EMPTY, Observable, Subject, combineLatest } from 'rxjs';
import { catchError, startWith, switchMap, tap } from 'rxjs/operators';
import { SharedNote } from '../../../core/model/share-link';
import { PublicNotesService } from '../public-notes.service';
import { NoteDetailsComponent } from '../../../shared/note-details/note-details.component';
import { SharedCopyFlow } from '../../../shared/shared-copy/shared-copy-flow.service';

@Component({
  selector: 'app-shareable-note-details',
  templateUrl: './shareable-note-details.component.html',
  styleUrls: ['./shareable-note-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NoteDetailsComponent],
})
export class ShareableNoteDetailsComponent implements OnInit {
  note$: Observable<SharedNote>;
  loadState: 'loading' | 'loaded' | 'unavailable' | 'error' = 'loading';
  private readonly retry$ = new Subject<void>();
  private copyAfterLoad = false;

  constructor(
    private route: ActivatedRoute,
    private publicNotesService: PublicNotesService,
    private sharedCopyFlow: SharedCopyFlow
  ) {}

  ngOnInit() {
    // back from a login started with "Copy to mine"
    this.copyAfterLoad = this.sharedCopyFlow.takeCopyRequest();
    this.note$ = combineLatest([
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
        return this.publicNotesService.getSharedNoteByToken(token).pipe(
          tap((note) => {
            this.loadState = 'loaded';
            if (this.copyAfterLoad) {
              this.copyAfterLoad = false;
              this.copyToMine(note);
            }
          }),
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

  copyToMine(note: SharedNote): void {
    this.sharedCopyFlow.start('note', note);
  }

  retry(): void {
    this.retry$.next();
  }
}
