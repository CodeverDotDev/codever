import { Component, Input, OnChanges } from '@angular/core';
import { Observable } from 'rxjs';
import { Snippet } from '../../../core/model/snippet';
import { PersonalSnippetsService } from '../../../core/personal-snippets.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { BackupBookmarksDialogComponent } from '../../../shared/dialog/backup-bookmarks-dialog/backup-bookmarks-dialog.component';

@Component({
  selector: 'app-my-snippets',
  templateUrl: './my-snippets.component.html'
})
export class MySnippetsComponent implements OnChanges {

  mySnippets$: Observable<Snippet[]>;

  @Input()
  userId: string;

  constructor(private personalSnippetsService: PersonalSnippetsService,
              private backupBookmarksDialog: MatDialog) {
  }

  ngOnChanges() {
    if (this.userId) { // TODO - maybe consider doing different to pass the userId to child component
      this.mySnippets$ = this.personalSnippetsService.getLatestSnippets(this.userId);
    }
  }

  exportMySnippets() {
    this.personalSnippetsService.getAllMySnippets(this.userId).subscribe(data =>
      this.downloadFile(data)
    );
  }

  private downloadFile(data: Snippet[]) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const dialogConfig = new MatDialogConfig();

    dialogConfig.autoFocus = true;
    dialogConfig.data = {
      blobUrl: window.URL.createObjectURL(blob),
      backupType: 'snippets'
    };

    this.backupBookmarksDialog.open(BackupBookmarksDialogComponent, dialogConfig);
  }
}
