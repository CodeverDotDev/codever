import { Component, Input, OnChanges } from '@angular/core';
import { Observable } from 'rxjs';
import { Note } from '../../../core/model/note';
import { PersonalNotesService } from '../../../core/personal-notes.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { BackupBookmarksDialogComponent } from '../../../shared/dialog/backup-bookmarks-dialog/backup-bookmarks-dialog.component';
import { PaginationNotificationService } from '../../../core/pagination-notification.service';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-my-notes',
    templateUrl: './my-notes.component.html',
    standalone: false
})
export class MyNotesComponent implements OnChanges {
  myNotes$: Observable<Note[]>;

  @Input()
  userId: string;

  callerPaginationMyNotes = 'my-notes';
  currentPage = 1;
  private initialized = false;

  constructor(
    private personalNotesService: PersonalNotesService,
    private backupDialog: MatDialog,
    private paginationNotificationService: PaginationNotificationService
  ) {}

  ngOnChanges() {
    if (this.userId && !this.initialized) {
      this.initialized = true;
      this.myNotes$ = this.personalNotesService.getLatestNotes(
        this.userId,
        1,
        environment.PAGINATION_PAGE_SIZE
      );

      this.paginationNotificationService.pageNavigationClicked$.subscribe(
        (paginationAction) => {
          if (paginationAction.caller === this.callerPaginationMyNotes) {
            this.currentPage = paginationAction.page;
            this.myNotes$ = this.personalNotesService.getLatestNotes(
              this.userId,
              paginationAction.page,
              environment.PAGINATION_PAGE_SIZE
            );
          }
        }
      );
    }
  }

  exportMyNotes() {
    this.personalNotesService
      .getAllMyNotes(this.userId)
      .subscribe((data) => this.downloadFile(data));
  }

  private downloadFile(data: Note[]) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const dialogConfig = new MatDialogConfig();

    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      blobUrl: window.URL.createObjectURL(blob),
      backupType: 'notes',
    };

    this.backupDialog.open(BackupBookmarksDialogComponent, dialogConfig);
  }
}
