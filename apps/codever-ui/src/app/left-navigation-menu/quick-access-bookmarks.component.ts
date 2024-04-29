import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Bookmark } from '../core/model/bookmark';
import { Router } from '@angular/router';
import { AddToHistoryService } from '../core/user/add-to-history.service';

@Component({
  selector: 'app-quick-access-bookmarks',
  templateUrl: './quick-access-bookmarks.component.html',
})
export class QuickAccessBookmarksComponent {
  private hovering: boolean[] = [
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ];

  @Input()
  quickAccessBookmarks: Bookmark[];

  @Input()
  source: string;

  @Output()
  newSectionTitleEvent = new EventEmitter<string>();

  constructor(
    protected router: Router,
    private addToHistoryService: AddToHistoryService
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

  resetHovering() {
    this.hovering.forEach((item) => (item = false));
  }

  addNewSectionTitleEvent(value: string) {
    this.newSectionTitleEvent.emit(value);
  }
}
