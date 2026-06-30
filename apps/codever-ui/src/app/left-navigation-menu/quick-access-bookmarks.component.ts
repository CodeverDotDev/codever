import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Bookmark } from '../core/model/bookmark';
import { Router } from '@angular/router';
import { AddToHistoryService } from '../core/user/add-to-history.service';
import {
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { UserDataPinnedStore } from '../core/user/userdata.pinned.store';

@Component({
  selector: 'app-quick-access-bookmarks',
  templateUrl: './quick-access-bookmarks.component.html',
  styleUrls: ['./quick-access-bookmarks.component.scss'],
})
export class QuickAccessBookmarksComponent {
  @Input()
  quickAccessBookmarks: Bookmark[];

  @Input()
  source: string;

  @Output()
  newSectionTitleEvent = new EventEmitter<string>();

  constructor(
    protected router: Router,
    private addToHistoryService: AddToHistoryService,
    private userDataPinnedStore: UserDataPinnedStore
  ) {}

  navigateToBookmarkDetails(bookmark: Bookmark): void {
    let link = [`./my-bookmarks/${bookmark._id}/details`];
    if (bookmark.public) {
      link = [`./bookmarks/${bookmark._id}/details`];
    }
    this.router.navigate(link, {
      state: { bookmark: bookmark },
    });
    this.addToHistoryService.promoteInHistoryIfLoggedIn(true, bookmark);
  }

  goToMainLink(bookmark: Bookmark) {
    this.addToHistoryService.promoteInHistoryIfLoggedIn(true, bookmark);
    window.open(bookmark.location, '_blank');
  }

  addNewSectionTitleEvent(value: string) {
    this.newSectionTitleEvent.emit(value);
  }

  dropPinnedBookmark(event: CdkDragDrop<Bookmark[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    const reordered = [...this.quickAccessBookmarks];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);
    this.quickAccessBookmarks = reordered;
    this.userDataPinnedStore.reorderPinnedBookmarks(reordered);
  }
}
