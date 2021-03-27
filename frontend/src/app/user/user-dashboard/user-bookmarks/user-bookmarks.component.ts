import { Component, Input, OnChanges } from '@angular/core';
import { Observable } from 'rxjs';
import { Bookmark } from '../../../core/model/bookmark';
import { UserData } from '../../../core/model/user-data';
import { MyBookmarksStore } from '../../../core/user/my-bookmarks.store';
import { PersonalBookmarksService } from '../../../core/personal-bookmarks.service';
import { Snippet } from '../../../core/model/snippet';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { BackupBookmarksDialogComponent } from '../../../shared/dialog/backup-bookmarks-dialog/backup-bookmarks-dialog.component';

@Component({
  selector: 'app-user-bookmarks',
  templateUrl: './user-bookmarks.component.html',
  styleUrls: ['./user-bookmarks.component.scss']
})
export class UserBookmarksComponent implements OnChanges {

  userBookmarks$: Observable<Bookmark[]>;
  orderBy = 'LAST_CREATED'; // TODO move to enum orderBy values

  @Input()
  userData$: Observable<UserData>;

  @Input()
  userId: string;

  constructor(private myBookmarksStore: MyBookmarksStore,
              private personalBookmarksService: PersonalBookmarksService,
              private backupBookmarksDialog: MatDialog) {
  }

  ngOnChanges() {
    if (this.userId) { // TODO - maybe consider doing different to pass the userId to child component
      this.userBookmarks$ = this.myBookmarksStore.getLastCreated$(this.userId, this.orderBy);
    }
  }

  getLastCreatedBookmarks() {
    this.orderBy = 'LAST_CREATED';
    this.userBookmarks$ = this.myBookmarksStore.getLastCreated$(this.userId, this.orderBy);
  }

  getMostLikedBookmarks() {
    this.orderBy = 'MOST_LIKES';
    this.userBookmarks$ = this.myBookmarksStore.getMostLiked$(this.userId, this.orderBy);
  }

  getMostUsedBookmarks() {
    this.orderBy = 'MOST_USED';
    this.userBookmarks$ = this.myBookmarksStore.getMostUsed$(this.userId, this.orderBy);
  }

  exportMyBookmarks() {
    this.personalBookmarksService.getAllMyBookmarks(this.userId).subscribe(data =>
      this.downloadFile(data)
    );
  }

  private downloadFile(data: Bookmark[]) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const dialogConfig = new MatDialogConfig();

    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      blobUrl: window.URL.createObjectURL(blob),
      backupType: 'bookmarks'
    };

    this.backupBookmarksDialog.open(BackupBookmarksDialogComponent, dialogConfig);
  }

}
