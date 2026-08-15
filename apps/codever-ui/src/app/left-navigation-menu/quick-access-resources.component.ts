import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Bookmark } from '../core/model/bookmark';
import { Note } from '../core/model/note';
import { UserDataResource } from '../core/model/user-data-resource.type';
import { Router } from '@angular/router';
import { AddToHistoryService } from '../core/user/add-to-history.service';
import {
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { UserDataPinnedStore } from '../core/user/userdata.pinned.store';

@Component({
  selector: 'app-quick-access-resources',
  templateUrl: './quick-access-resources.component.html',
  styleUrls: ['./quick-access-resources.component.scss'],
})
export class QuickAccessResourcesComponent {
  @Input()
  quickAccessResources: UserDataResource[];

  @Input()
  source: string;

  pinnedFilterText = '';

  @Output()
  newSectionTitleEvent = new EventEmitter<string>();

  constructor(
    protected router: Router,
    private addToHistoryService: AddToHistoryService,
    private userDataPinnedStore: UserDataPinnedStore
  ) {}

  /** True when the pinned entry is a note rather than a bookmark. */
  isNote(resource: UserDataResource): boolean {
    return resource.type === 'note';
  }

  /** Display label: note title or bookmark name. */
  getLabel(resource: UserDataResource): string {
    return this.isNote(resource)
      ? (resource as Note).title
      : (resource as Bookmark).name;
  }

  get filteredPinnedResources(): UserDataResource[] {
    const filterText = this.pinnedFilterText.trim().toLocaleLowerCase();
    if (!filterText) {
      return this.quickAccessResources;
    }

    return this.quickAccessResources.filter((resource) =>
      this.getLabel(resource).toLocaleLowerCase().includes(filterText)
    );
  }

  /** Tooltip: note title or bookmark "name - location". */
  getTooltip(resource: UserDataResource): string {
    if (this.isNote(resource)) {
      return (resource as Note).title;
    }
    const bookmark = resource as Bookmark;
    return `${bookmark.name} - ${bookmark.location}`;
  }

  navigateToDetails(resource: UserDataResource): void {
    if (this.isNote(resource)) {
      const link = resource.public
        ? [`./notes/${resource._id}/details`]
        : [`./my-notes/${resource._id}/details`];
      this.router.navigate(link, {
        state: { note: resource },
      });
      return;
    }

    this.navigateToBookmarkDetails(resource as Bookmark);
  }

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

  goToMainLink(resource: UserDataResource) {
    const bookmark = resource as Bookmark;
    this.addToHistoryService.promoteInHistoryIfLoggedIn(true, bookmark);
    window.open(bookmark.location, '_blank');
  }

  addNewSectionTitleEvent(value: string) {
    this.newSectionTitleEvent.emit(value);
  }

  dropUserDataResource(event: CdkDragDrop<UserDataResource[]>) {
    if (
      this.pinnedFilterText.trim() ||
      event.previousIndex === event.currentIndex
    ) {
      return;
    }
    const reordered = [...this.quickAccessResources];
    moveItemInArray(reordered, event.previousIndex, event.currentIndex);
    this.quickAccessResources = reordered;
    this.userDataPinnedStore.reorderPinnedBookmarks(reordered);
  }
}
