import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { AuthenticationService } from '../auth/authentication.service';
import { UserDataService } from '../user-data.service';
import { NotifyStoresService } from './notify-stores.service';
import { UserDataStore } from './userdata.store';
import { UserDataPinnedStore } from './userdata.pinned.store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('UserDataPinnedStore pagination caches', () => {
  let store: UserDataPinnedStore;
  let getPinnedResources: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getPinnedResources = vi.fn((userId: string, page: number, limit: number) =>
      of(
        Array.from({ length: limit }, (_, index) => ({
          _id: `${page}-${index}`,
          type: 'bookmark' as const,
        }))
      )
    );

    TestBed.configureTestingModule({
      providers: [
        UserDataPinnedStore,
        { provide: UserDataService, useValue: { getPinnedResources } },
        { provide: UserDataStore, useValue: {} },
        { provide: AuthenticationService, useValue: {} },
        {
          provide: NotifyStoresService,
          useValue: { bookmarkDeleted$: new Subject() },
        },
      ],
    });
    store = TestBed.inject(UserDataPinnedStore);
  });

  it('keeps quick access pinned resources separate from home pagination', () => {
    let quickAccessIds: string[];
    let homePageIds: string[];

    store
      .getPinnedResources$('owner', 1, 20)
      .subscribe((resources) => (quickAccessIds = resources?.map((r) => r._id)));
    store
      .getPinnedResources$('owner', 2, 10)
      .subscribe((resources) => (homePageIds = resources?.map((r) => r._id)));

    expect(getPinnedResources).toHaveBeenCalledTimes(2);
    expect(getPinnedResources).toHaveBeenNthCalledWith(1, 'owner', 1, 20);
    expect(getPinnedResources).toHaveBeenNthCalledWith(2, 'owner', 2, 10);
    expect(quickAccessIds).toHaveLength(20);
    expect(quickAccessIds[0]).toBe('1-0');
    expect(homePageIds).toHaveLength(10);
    expect(homePageIds[0]).toBe('2-0');
  });
});
