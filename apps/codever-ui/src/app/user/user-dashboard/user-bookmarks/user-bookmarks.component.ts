import { Component, Input, OnChanges } from '@angular/core';
import { Observable } from 'rxjs';
import { Bookmark } from '../../../core/model/bookmark';
import { UserData } from '../../../core/model/user-data';
import { PersonalBookmarksService } from '../../../core/personal-bookmarks.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { BackupBookmarksDialogComponent } from '../../../shared/dialog/backup-bookmarks-dialog/backup-bookmarks-dialog.component';
import { ImportBookmarksDialogComponent } from '../../../shared/dialog/import-bookmarks-dialog/import-bookmarks-dialog.component';
import { UserDataHistoryStore } from '../../../core/user/userdata.history.store';
import { UserDataStore } from '../../../core/user/userdata.store';
import { MyBookmarksStore } from '../../../core/user/my-bookmarks.store';
import { PaginationNotificationService } from '../../../core/pagination-notification.service';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-my-bookmarks',
    templateUrl: './user-bookmarks.component.html',
    styleUrls: ['./user-bookmarks.component.scss'],
    standalone: false
})
export class UserBookmarksComponent implements OnChanges {
  userBookmarks$: Observable<Bookmark[]>;
  orderBy = 'LAST_CREATED';
  callerPaginationMyBookmarks = 'my-bookmarks';
  currentPage = 1;
  private initialized = false;

  @Input()
  userData$: Observable<UserData>;

  @Input()
  userId: string;

  constructor(
    private myBookmarksStore: MyBookmarksStore,
    private personalBookmarksService: PersonalBookmarksService,
    private userDataHistoryStore: UserDataHistoryStore,
    private userDataStore: UserDataStore,
    private importBookmarksDialog: MatDialog,
    private backupBookmarksDialog: MatDialog,
    private paginationNotificationService: PaginationNotificationService
  ) {}

  ngOnChanges() {
    if (this.userId && !this.initialized) {
      this.initialized = true;
      this.loadBookmarks(1);

      this.paginationNotificationService.pageNavigationClicked$.subscribe(
        (paginationAction) => {
          if (paginationAction.caller === this.callerPaginationMyBookmarks) {
            this.loadBookmarks(paginationAction.page);
          }
        }
      );
    }
  }

  private loadBookmarks(page: number) {
    this.currentPage = page;
    this.userBookmarks$ = this.personalBookmarksService.getPersonalBookmarkOrderedBy(
      this.userId,
      this.orderBy,
      page,
      environment.PAGINATION_PAGE_SIZE
    );
  }

  getLastCreatedBookmarks() {
    this.orderBy = 'LAST_CREATED';
    this.loadBookmarks(1);
  }

  getMostLikedBookmarks() {
    this.orderBy = 'MOST_LIKES';
    this.loadBookmarks(1);
  }

  getMostUsedBookmarks() {
    this.orderBy = 'MOST_USED';
    this.loadBookmarks(1);
  }

  exportMyBookmarks() {
    this.personalBookmarksService
      .getAllMyBookmarks(this.userId)
      .subscribe((data) => this.downloadFile(data));
  }

  private downloadFile(data: Bookmark[]) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const dialogConfig = new MatDialogConfig();

    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      blobUrl: window.URL.createObjectURL(blob),
      backupType: 'bookmarks',
    };

    this.backupBookmarksDialog.open(
      BackupBookmarksDialogComponent,
      dialogConfig
    );
  }

  public importBookmarks() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      userId: this.userId,
    };

    const dialogRef = this.backupBookmarksDialog.open(
      ImportBookmarksDialogComponent,
      dialogConfig
    );
    dialogRef.afterClosed().subscribe((result) => {
      const addToHistory = result.created.sort((a, b) =>
        a.createdAt > b.createdAt ? -1 : b.createdAt > a.createdAt ? 1 : 0
      );
      this.userDataStore.updateUserDataHistoryBulk$(addToHistory.slice(0, 50));
      this.myBookmarksStore.addToLastCreatedBulk(addToHistory.slice(0, 30));
    });
  }
}
