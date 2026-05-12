import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Note } from '../../core/model/note';
import { PublicNotesService } from '../notes/public-notes.service';
import { ActivatedRoute } from '@angular/router';
import { PaginationNotificationService } from '../../core/pagination-notification.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-public-notes',
  templateUrl: './public-notes.component.html',
})
export class PublicNotesComponent implements OnInit {
  notes$: Observable<Note[]>;

  currentPage = 1;
  callerPaginationPublicNotes = 'public-notes';

  constructor(
    private publicNotesService: PublicNotesService,
    private route: ActivatedRoute,
    private paginationNotificationService: PaginationNotificationService
  ) {}

  ngOnInit(): void {
    const page = this.route.snapshot.queryParamMap.get('page');
    if (page) {
      this.currentPage = parseInt(page, 0);
    }

    this.notes$ = this.publicNotesService.getLatestPublicNotes(
      this.currentPage,
      environment.PAGINATION_PAGE_SIZE
    );

    this.paginationNotificationService.pageNavigationClicked$.subscribe(
      (paginationAction) => {
        if (paginationAction.caller === this.callerPaginationPublicNotes) {
          this.notes$ = this.publicNotesService.getLatestPublicNotes(
            paginationAction.page,
            environment.PAGINATION_PAGE_SIZE
          );
        }
      }
    );
  }
}

