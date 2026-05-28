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

        this.loading = false;
      });
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

