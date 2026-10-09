import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Collection } from '../../core/model/collection';
import { PersonalCollectionsService } from '../../core/personal-collections.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { Bookmark } from '../../core/model/bookmark';
import { Note } from '../../core/model/note';
import { MainLinkShortcutService } from '../../core/shortcut/main-link-shortcut.service';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-collection-detail',
  templateUrl: './collection-detail.component.html',
  styleUrls: ['./collection-detail.component.scss'],
  imports: [FormsModule, NgClass, RouterLink],
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private personalCollectionsService: PersonalCollectionsService,
    private userInfoStore: UserInfoStore,
    private mainLinkShortcutService: MainLinkShortcutService
  ) {}

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
   * Enter in the focused filter opens the only visible bookmark's main link in
   * a new tab. No-op unless exactly one bookmark and no notes are visible.
   */
  onFilterEnter(): void {
    if (
      this.filteredBookmarks.length === 1 &&
      this.filteredNotes.length === 0
    ) {
      this.mainLinkShortcutService.openBookmarkInNewTab(
        this.filteredBookmarks[0],
        true
      );
    }
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
