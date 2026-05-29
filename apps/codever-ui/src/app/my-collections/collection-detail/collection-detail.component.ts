import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Collection } from '../../core/model/collection';
import { PersonalCollectionsService } from '../../core/personal-collections.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { Bookmark } from '../../core/model/bookmark';
import { Note } from '../../core/model/note';

@Component({
  selector: 'app-collection-detail',
  templateUrl: './collection-detail.component.html',
  styleUrls: ['./collection-detail.component.scss'],
})
export class CollectionDetailComponent implements OnInit {
  collection: Collection;
  userId: string;
  bookmarks: Bookmark[] = [];
  notes: Note[] = [];
  filteredBookmarks: Bookmark[] = [];
  filteredNotes: Note[] = [];
  bookmarkFilter = '';
  noteFilter = '';
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private personalCollectionsService: PersonalCollectionsService,
    private userInfoStore: UserInfoStore
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

  filterBookmarks(): void {
    const q = this.bookmarkFilter.toLowerCase().trim();
    this.filteredBookmarks = q
      ? this.bookmarks.filter((b) => b.name?.toLowerCase().includes(q))
      : [...this.bookmarks];
  }

  filterNotes(): void {
    const q = this.noteFilter.toLowerCase().trim();
    this.filteredNotes = q
      ? this.notes.filter((n) => n.title?.toLowerCase().includes(q))
      : [...this.notes];
  }

  removeItem(resourceId: string): void {
    this.personalCollectionsService
      .removeItemFromCollection(this.userId, this.collection._id, resourceId)
      .subscribe((updated) => {
        this.collection = updated;
        this.bookmarks = this.bookmarks.filter((b) => b._id !== resourceId);
        this.notes = this.notes.filter((n) => n._id !== resourceId);
        this.filterBookmarks();
        this.filterNotes();
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

