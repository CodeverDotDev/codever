import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Bookmark } from '../core/model/bookmark';
import { Note } from '../core/model/note';
import { UserDataResource } from '../core/model/user-data-resource.type';
import { PinnedCollection } from '../core/model/collection';
import { Router } from '@angular/router';
import { AddToHistoryService } from '../core/user/add-to-history.service';
import {
  CdkDragDrop,
  moveItemInArray,
  CdkDropList,
  CdkDrag,
  CdkDragHandle,
} from '@angular/cdk/drag-drop';
import { UserDataPinnedStore } from '../core/user/userdata.pinned.store';
import { MainLinkShortcutService } from '../core/shortcut/main-link-shortcut.service';
import {
  ActivatableType,
  activationHintLabel,
  singleVisibleResource,
} from '../core/shortcut/resource-activation.util';
import { FormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { NgClass } from '@angular/common';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UserInfoStore } from '../core/user/user-info.store';
import { CollectionContentsDialogComponent } from '../shared/dialog/collection-contents-dialog/collection-contents-dialog.component';

@Component({
  selector: 'app-quick-access-resources',
  templateUrl: './quick-access-resources.component.html',
  styleUrls: ['./quick-access-resources.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    FormsModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    MatTooltip,
    NgClass,
  ],
})
export class QuickAccessResourcesComponent {
  @Input()
  quickAccessResources: UserDataResource[];

  @Input()
  source: string;

  pinnedFilterText = '';

  /** Resource types the focused Pinned filter can activate with Enter. */
  readonly activatableTypes: ActivatableType[] = [
    'bookmark',
    'note',
    'collection',
  ];

  userId: string;

  @Output()
  newSectionTitleEvent = new EventEmitter<string>();

  constructor(
    protected router: Router,
    private addToHistoryService: AddToHistoryService,
    private userDataPinnedStore: UserDataPinnedStore,
    private mainLinkShortcutService: MainLinkShortcutService,
    private userInfoStore: UserInfoStore,
    private collectionContentsDialog: MatDialog
  ) {
    this.userInfoStore
      .getUserId$()
      .subscribe((userId) => (this.userId = userId));
  }

  /** True when the pinned entry is a collection. */
  isCollection(resource: UserDataResource): boolean {
    return resource.type === 'collection';
  }

  /** True when the pinned entry is a bookmark. */
  isBookmark(resource: UserDataResource): boolean {
    return resource.type === 'bookmark';
  }

  /** True when the pinned entry is a note rather than a bookmark or collection. */
  isNote(resource: UserDataResource): boolean {
    return resource.type === 'note';
  }

  /** True for a publicly visible bookmark or note (never a collection). */
  isPublicResource(resource: UserDataResource): boolean {
    return (
      !this.isCollection(resource) &&
      (resource as Bookmark | Note).public === true
    );
  }

  /** True for a private bookmark or note (never a collection). */
  isPrivateResource(resource: UserDataResource): boolean {
    return (
      !this.isCollection(resource) &&
      (resource as Bookmark | Note).public === false
    );
  }

  /** Display label: collection name, note title, or bookmark name. */
  getLabel(resource: UserDataResource): string {
    if (this.isCollection(resource)) {
      return (resource as PinnedCollection).name;
    }
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

  /**
   * The single activatable entry in the filtered pinned list, or null when the
   * filter leaves zero, several, or a non-activatable result.
   */
  get singleFilteredResource(): UserDataResource | null {
    return singleVisibleResource(
      this.filteredPinnedResources,
      this.activatableTypes
    );
  }

  /**
   * Hint label for the focused filter ("bookmark", "note", or "collection"),
   * or null when pressing Enter would not activate anything.
   */
  get filterActivationHint(): ActivatableType | null {
    return activationHintLabel(this.singleFilteredResource);
  }

  /** Tooltip: collection name, note title, or bookmark "name - location". */
  getTooltip(resource: UserDataResource): string {
    if (this.isCollection(resource)) {
      return `${(resource as PinnedCollection).name} (collection)`;
    }
    if (this.isNote(resource)) {
      return (resource as Note).title;
    }
    const bookmark = resource as Bookmark;
    return `${bookmark.name} - ${bookmark.location}`;
  }

  navigateToDetails(resource: UserDataResource): void {
    if (this.isCollection(resource)) {
      this.router.navigate(['/my-collections', resource._id]);
      return;
    }
    if (this.isNote(resource)) {
      // Use absolute paths: this component is rendered in the root
      // app.component, so a relative (`./`) target would be resolved against
      // whatever route is currently active. On a public note details page that
      // collides with the `notes/:id` → `/notes/:id/details` redirect and
      // triggers an NG04016 infinite-redirect loop.
      const note = resource as Note;
      const link = note.public
        ? [`/notes/${note._id}/details`]
        : [`/my-notes/${note._id}/details`];
      this.router.navigate(link, {
        state: { note },
      });
      return;
    }

    this.navigateToBookmarkDetails(resource as Bookmark);
  }

  navigateToBookmarkDetails(bookmark: Bookmark): void {
    // Absolute paths (see navigateToDetails) to avoid route-relative resolution.
    let link = [`/my-bookmarks/${bookmark._id}/details`];
    if (bookmark.public) {
      link = [`/bookmarks/${bookmark._id}/details`];
    }
    this.router.navigate(link, {
      state: { bookmark: bookmark },
    });
    this.addToHistoryService.promoteInHistoryIfLoggedIn(true, bookmark);
  }

  goToMainLink(event: Event, resource: UserDataResource): void {
    event.stopPropagation();
    const bookmark = resource as Bookmark;
    this.addToHistoryService.promoteInHistoryIfLoggedIn(true, bookmark);
    window.open(bookmark.location, '_blank');
  }

  /**
   * Opens the pinned collection's contents dialog without navigating the
   * sidebar entry. Stops propagation so the enclosing link is not followed.
   */
  openCollectionContents(event: Event, resource: UserDataResource): void {
    event.stopPropagation();
    const dialogConfig = new MatDialogConfig();
    dialogConfig.autoFocus = true;
    dialogConfig.width = '800px';
    dialogConfig.maxWidth = '92vw';
    dialogConfig.maxHeight = '80vh';
    dialogConfig.data = {
      userId: this.userId,
      collectionId: resource._id,
      collectionName: (resource as PinnedCollection).name,
    };
    this.collectionContentsDialog.open(
      CollectionContentsDialogComponent,
      dialogConfig
    );
  }

  /**
   * Enter in the focused Pinned filter activates the only visible result: a
   * bookmark's main link in a new tab, or a note's or collection's details page
   * in the current tab. Does nothing for zero or multiple results.
   */
  onFilterEnter(): void {
    const resource = this.singleFilteredResource;
    if (resource) {
      this.mainLinkShortcutService.activateResource(
        resource,
        true,
        this.activatableTypes
      );
    }
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
