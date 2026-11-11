import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Bookmark } from '../../../core/model/bookmark';
import { PublicBookmarksService } from '../public-bookmarks.service';
import { PublicBookmarksStore } from './public-bookmarks-store.service';

function bookmark(id: string): Bookmark {
  return {
    _id: id,
    type: 'bookmark',
    name: id,
    location: `https://${id}.example.com`,
    tags: [],
  };
}

describe('PublicBookmarksStore deletion', () => {
  let store: PublicBookmarksStore;
  const first = bookmark('first');
  const second = bookmark('second');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PublicBookmarksStore,
        {
          provide: PublicBookmarksService,
          useValue: {
            getRecentPublicBookmarks: vi.fn(() => of([first, second])),
          },
        },
      ],
    });
    store = TestBed.inject(PublicBookmarksStore);
  });

  it('removes only a bookmark present in the loaded public list', () => {
    let bookmarks: Bookmark[];
    store
      .getRecentPublicBookmarks$(1)
      .subscribe((value) => (bookmarks = value));

    store.removeBookmarkFromPublicStore(bookmark('missing'));
    expect(bookmarks).toEqual([first, second]);

    store.removeBookmarkFromPublicStore(first);
    expect(bookmarks).toEqual([second]);
  });
});
