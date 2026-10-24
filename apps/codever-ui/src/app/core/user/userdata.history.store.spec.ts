import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { UserDataService } from '../user-data.service';
import { UserInfoStore } from './user-info.store';
import { NotifyStoresService } from './notify-stores.service';
import { LocalStorageService } from '../cache/local-storage.service';
import { UserDataHistoryStore } from './userdata.history.store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('UserDataHistoryStore pagination caches', () => {
  let store: UserDataHistoryStore;
  let getHistory: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getHistory = vi.fn((userId: string, page: number, limit: number) =>
      of(
        Array.from({ length: limit }, (_, index) => ({
          _id: `${page}-${index}`,
          type: 'bookmark' as const,
        }))
      )
    );

    TestBed.configureTestingModule({
      providers: [
        UserDataHistoryStore,
        { provide: UserDataService, useValue: { getHistory$: getHistory } },
        { provide: UserInfoStore, useValue: {} },
        {
          provide: NotifyStoresService,
          useValue: { bookmarkDeleted$: new Subject() },
        },
        { provide: LocalStorageService, useValue: {} },
      ],
    });
    store = TestBed.inject(UserDataHistoryStore);
  });

  it('keeps the 10-item quick access list separate from home pagination', () => {
    let quickAccessIds: string[];
    let homePageIds: string[];

    store
      .getHistory$('owner', 1, 10)
      .subscribe((resources) => (quickAccessIds = resources?.map((r) => r._id)));
    store
      .getHistory$('owner', 1, 5)
      .subscribe((resources) => (homePageIds = resources?.map((r) => r._id)));

    expect(getHistory).toHaveBeenCalledTimes(2);
    expect(getHistory).toHaveBeenNthCalledWith(1, 'owner', 1, 10);
    expect(getHistory).toHaveBeenNthCalledWith(2, 'owner', 1, 5);
    expect(quickAccessIds).toHaveLength(10);
    expect(homePageIds).toHaveLength(5);
  });
});
