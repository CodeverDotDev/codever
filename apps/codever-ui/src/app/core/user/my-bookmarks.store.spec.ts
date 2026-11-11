import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Bookmark } from '../model/bookmark';
import { PersonalBookmarksService } from '../personal-bookmarks.service';
import { MyBookmarksStore } from './my-bookmarks.store';

function bookmark(id: string): Bookmark {
  return {
    _id: id,
    type: 'bookmark',
    name: id,
    location: `https://${id}.example.com`,
    userId: 'owner',
    public: false,
    tags: [],
    likeCount: 0,
  };
}

describe('MyBookmarksStore deletion', () => {
  let store: MyBookmarksStore;
  const first = bookmark('first');
  const second = bookmark('second');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MyBookmarksStore,
        {
          provide: PersonalBookmarksService,
          useValue: {
            getPersonalBookmarkOrderedBy: vi.fn(() => of([first, second])),
          },
        },
      ],
    });
    store = TestBed.inject(MyBookmarksStore);
  });

  it('removes only the deleted bookmark from loaded lists', () => {
    let lastCreated: Bookmark[];
    let mostLiked: Bookmark[];
    let mostUsed: Bookmark[];
    store
      .getLastCreated$('owner', 'createdAt')
      .subscribe((bookmarks) => (lastCreated = bookmarks));
    store
      .getMostLiked$('owner', 'likeCount')
      .subscribe((bookmarks) => (mostLiked = bookmarks));
    store
      .getMostUsed$('owner', 'visitCount')
      .subscribe((bookmarks) => (mostUsed = bookmarks));

    store.removeFromStoresAtDeletion(bookmark('missing'));

    expect(lastCreated).toEqual([first, second]);
    expect(mostLiked).toEqual([first, second]);
    expect(mostUsed).toEqual([first, second]);

    store.removeFromStoresAtDeletion(first);

    expect(lastCreated).toEqual([second]);
    expect(mostLiked).toEqual([second]);
    expect(mostUsed).toEqual([second]);
  });
});
