import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Collection } from '../../core/model/collection';
import { PersonalCollectionsService } from '../../core/personal-collections.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { Bookmark } from '../../core/model/bookmark';
import { Note } from '../../core/model/note';
import { UserDataResource } from '../../core/model/user-data-resource.type';
import { MainLinkShortcutService } from '../../core/shortcut/main-link-shortcut.service';
import {
  ActivatableType,
  activationHintLabel,
  singleVisibleResource,
} from '../../core/shortcut/resource-activation.util';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, NgClass } from '@angular/common';
import { Observable } from 'rxjs';
import { UserData } from '../../core/model/user-data';
import { UserDataStore } from '../../core/user/userdata.store';
import { UserDataPinnedStore } from '../../core/user/userdata.pinned.store';

@Component({
  selector: 'app-collection-detail',
  templateUrl: './collection-detail.component.html',
  styleUrls: ['./collection-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule, NgClass, RouterLink, AsyncPipe],
})
export class CollectionDetailComponent implements OnInit {
  collection: Collection;
  userId: string;
  bookmarks: Bookmark[] = [];
  notes: Note[] = [];
  filteredBookmarks: Bookmark[] = [];
  filteredNotes: Note[] = [];
  unifiedFilter = '';
  loading = true;
  userData$: Observable<UserData>;

  /** Resource types the focused collection filter can activate with Enter. */
  readonly activatableTypes: ActivatableType[] = ['bookmark', 'note'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private personalCollectionsService: PersonalCollectionsService,
    private userInfoStore: UserInfoStore,
    private mainLinkShortcutService: MainLinkShortcutService,
    private userDataStore: UserDataStore,
    private userDataPinnedStore: UserDataPinnedStore
  ) {
    this.userData$ = this.userDataStore.getUserData$();
  }

  ngOnInit(): void {
    this.userInfoStore.getUserInfoOidc$().subscribe((userInfo) => {
      this.userId = userInfo.sub;
      const collectionId = this.route.snapshot.params['collectionId'];
      this.loadCollection(collectionId);
    });
  }

  loadCollection(collectionId: string): void {
    this.loading = true;
    this.personalCollectionsService
      .getCollectionById(this.userId, collectionId)
      .subscribe((collection) => {
        this.collection = collection;

        // Extract populated items by type — already fetched in a single API call
        const populated = collection.populatedItems || [];
        this.bookmarks = populated
          .filter((item) => item.resourceType === 'bookmark')
          .map((item) => item.resource as Bookmark);
        this.notes = populated
          .filter((item) => item.resourceType === 'note')
          .map((item) => item.resource as Note);

        this.filteredBookmarks = [...this.bookmarks];
        this.filteredNotes = [...this.notes];
        this.loading = false;
      });
  }

  applyFilter(): void {
    const q = this.unifiedFilter.toLowerCase().trim();
    if (!q) {
      this.filteredBookmarks = [...this.bookmarks];
      this.filteredNotes = [...this.notes];
    } else {
      this.filteredBookmarks = this.bookmarks.filter(
        (b) =>
          b.name?.toLowerCase().includes(q) ||
          b.tags?.some((t) => t.toLowerCase().includes(q)) ||
          b.description?.toLowerCase().includes(q)
      );
      this.filteredNotes = this.notes.filter(
        (n) =>
          n.title?.toLowerCase().includes(q) ||
          n.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
  }

  /**
   * Enter in the focused filter activates the only visible result: a bookmark's
   * main link in a new tab, or a note's details page in the current tab. Both
   * lists are summed, so one bookmark plus one note is ambiguous and does
   * nothing.
   */
  onFilterEnter(): void {
    const resource = this.singleActivatableResource;
    if (resource) {
      this.mainLinkShortcutService.activateResource(
        resource,
        true,
        this.activatableTypes
      );
    }
  }

  /** Hint label for the focused filter, or null when Enter would do nothing. */
  get filterActivationHint(): ActivatableType | null {
    return activationHintLabel(this.singleActivatableResource);
  }

  /**
   * The single activatable result across both filtered lists, or null when zero
   * or several entries remain.
   */
  private get singleActivatableResource(): UserDataResource | null {
    return singleVisibleResource(
      [...this.filteredBookmarks, ...this.filteredNotes],
      this.activatableTypes
    );
  }

  removeItem(resourceId: string): void {
    this.personalCollectionsService
      .removeItemFromCollection(this.userId, this.collection._id, resourceId)
      .subscribe((updated) => {
        this.collection = updated;
        this.bookmarks = this.bookmarks.filter((b) => b._id !== resourceId);
        this.notes = this.notes.filter((n) => n._id !== resourceId);
        this.applyFilter();
      });
  }

  /** True when the collection is part of the user's typed pinned entries. */
  isPinned(userData: UserData | null, collection: Collection): boolean {
    return (userData?.pinned || []).some(
      (entry) => entry.type === 'collection' && entry.id === collection._id
    );
  }

  addToPinned(collection: Collection): void {
    this.userDataPinnedStore.addCollectionToPinned(collection);
  }

  removeFromPinned(collection: Collection): void {
    this.userDataPinnedStore.removeCollectionFromPinned(collection);
  }

  goBack(): void {
    this.router.navigate(['/my-collections']);
  }

  highlightText(text: string, filter: string): string {
    if (!filter || !text) {
      return text || '';
    }
    const escaped = filter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark class="filter-highlight">$1</mark>');
  }
}
