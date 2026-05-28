import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Collection } from '../../core/model/collection';
import { PersonalCollectionsService } from '../../core/personal-collections.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { PersonalBookmarksService } from '../../core/personal-bookmarks.service';
import { PersonalNotesService } from '../../core/personal-notes.service';
import { Bookmark } from '../../core/model/bookmark';
import { Note } from '../../core/model/note';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private personalCollectionsService: PersonalCollectionsService,
    private personalBookmarksService: PersonalBookmarksService,
    private personalNotesService: PersonalNotesService,
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
        this.loadItems();
      });
  }

  private loadItems(): void {
    const bookmarkItems = this.collection.items.filter(
      (i) => i.resourceType === 'bookmark'
    );
    const noteItems = this.collection.items.filter(
      (i) => i.resourceType === 'note'
    );

    const bookmarkRequests = bookmarkItems.map((item) =>
      this.personalBookmarksService
        .getPersonalBookmarkById(this.userId, item.resourceId)
        .pipe(catchError(() => of(null)))
    );
    const noteRequests = noteItems.map((item) =>
      this.personalNotesService
        .getPersonalNoteById(this.userId, item.resourceId)
        .pipe(catchError(() => of(null)))
    );

    forkJoin([...bookmarkRequests]).subscribe((results) => {
      this.bookmarks = results.filter((b) => b !== null) as Bookmark[];
    });

    forkJoin([...noteRequests]).subscribe((results) => {
      this.notes = results.filter((n) => n !== null) as Note[];
      this.loading = false;
    });

    // Handle case where there are no items
    if (bookmarkItems.length === 0) {
      this.bookmarks = [];
    }
    if (noteItems.length === 0) {
      this.notes = [];
      this.loading = false;
    }
  }

  removeItem(resourceId: string): void {
    this.personalCollectionsService
      .removeItemFromCollection(this.userId, this.collection._id, resourceId)
      .subscribe((updated) => {
        this.collection = updated;
        this.bookmarks = this.bookmarks.filter((b) => b._id !== resourceId);
        this.notes = this.notes.filter((n) => n._id !== resourceId);
      });
  }

  goBack(): void {
    this.router.navigate(['/my-collections']);
  }
}

