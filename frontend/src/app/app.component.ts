import { Component, HostListener } from '@angular/core';

import 'styles.scss';
import { UserDataHistoryStore } from './core/user/userdata.history.store';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { HotKeysDialogComponent } from './shared/history-dialog/hot-keys-dialog.component';
import { UserDataPinnedStore } from './core/user/userdata.pinned.store';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  url = 'https://www.bookmarks.dev';
  innerWidth: any;
  constructor(private userDataHistoryStore: UserDataHistoryStore,
              private userDataPinnedStore: UserDataPinnedStore,
              private historyDialog: MatDialog) {
    this.innerWidth = 100;
  }

  @HostListener('window:keydown.control.p', ['$event'])
  showPinned(event: KeyboardEvent) {
    event.preventDefault();
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = true;
    dialogConfig.width = this.getRelativeWidth();

    dialogConfig.data = {
      bookmarks$: this.userDataPinnedStore.getPinnedBookmarks$(1),
      title: '<i class="fas fa-thumbtack"></i> Pinned'
    };

    const dialogRef = this.historyDialog.open(HotKeysDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(
      data => {
        console.log('Dialog output:', data);
      }
    );
  }

  private getRelativeWidth() {
    let relativeWidth = (window.innerWidth * 80) / 100;
    if (window.innerWidth > 1500) {
      relativeWidth = (1500 * 80) / 100;
    }

    return relativeWidth + 'px';
  }

  @HostListener('window:keydown.control.h', ['$event'])
  showHistory(event: KeyboardEvent) {
    event.preventDefault();
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = false;
    dialogConfig.autoFocus = true;
    dialogConfig.width = this.getRelativeWidth();
    dialogConfig.data = {
      bookmarks$: this.userDataHistoryStore.getHistory$(1),
      title: '<i class="fas fa-history"></i> History'
    };

    const dialogRef = this.historyDialog.open(HotKeysDialogComponent, dialogConfig);
    dialogRef.afterClosed().subscribe(
      data => {
        console.log('Dialog output:', data);
      }
    );
  }
}
