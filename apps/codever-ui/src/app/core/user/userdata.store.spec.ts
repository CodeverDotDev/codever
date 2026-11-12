import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { LocalStorageService } from '../cache/local-storage.service';
import { PersonalBookmarksService } from '../personal-bookmarks.service';
import { UserFavoriteMutation, UserData } from '../model/user-data';
import { UserDataService } from '../user-data.service';
import { NotifyStoresService } from './notify-stores.service';
import { UserDataHistoryStore } from './userdata.history.store';
import { UserDataStore } from './userdata.store';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';

describe('UserDataStore favorites', () => {
  let store: UserDataStore;
  let notifyStoresService: Pick<
    NotifyStoresService,
    'deleteBookmark' | 'deleteNote'
  >;
  let userService: Mocked<
    Pick<
      UserDataService,
      | 'getUserData'
      | 'updateUserFavorite'
      | 'updateUserData'
      | 'updateHomeTabs'
    >
  >;
  let userData: UserData;

  beforeEach(() => {
    userService = {
      getUserData: vi.fn<UserDataService['getUserData']>(),
      updateUserFavorite: vi.fn<UserDataService['updateUserFavorite']>(),
      updateUserData: vi.fn<UserDataService['updateUserData']>(),
      updateHomeTabs: vi.fn<UserDataService['updateHomeTabs']>(),
    };
    userData = {
      userId: 'owner',
      searches: [],
      favorites: ['bookmark-existing'],
      favoriteNotes: ['note-existing'],
      likes: ['bookmark-liked'],
    };
    notifyStoresService = {
      deleteBookmark: vi.fn(),
      deleteNote: vi.fn(),
    };
    userService.getUserData.mockReturnValue(of(userData));
    userService.updateUserData.mockReturnValue(of(userData));

    TestBed.configureTestingModule({
      providers: [
        UserDataStore,
        { provide: UserDataService, useValue: userService },
        { provide: NotifyStoresService, useValue: notifyStoresService },
        { provide: UserDataHistoryStore, useValue: {} },
        { provide: PersonalBookmarksService, useValue: {} },
        { provide: LocalStorageService, useValue: {} },
      ],
    });
    store = TestBed.inject(UserDataStore);
    store.loadInitialUserDataFromDb('owner', 'Owner', 'owner@example.com');
  });

  it('updates bookmark favorites only after a successful response', () => {
    const response = new Subject<UserFavoriteMutation>();
    userService.updateUserFavorite.mockReturnValue(response.asObservable());

    store.toggleFavorite$('bookmark', 'bookmark-new').subscribe();

    expect(userService.updateUserFavorite).toHaveBeenCalledWith('owner', {
      resourceType: 'bookmark',
      resourceId: 'bookmark-new',
      favorite: true,
    });

    expect(userData.favorites).toEqual(['bookmark-existing']);
    expect(userData.favoriteNotes).toEqual(['note-existing']);

    response.next({
      resourceType: 'bookmark',
      resourceId: 'bookmark-new',
      favorite: true,
    });

    expect(userData.favorites).toEqual(['bookmark-existing', 'bookmark-new']);
    expect(userData.favoriteNotes).toEqual(['note-existing']);
    expect(userData.likes).toEqual(['bookmark-liked']);
  });

  it('updates home tabs in the user data store after saving', () => {
    const homeTabs = ['pinned', 'feed', 'history', 'read-later'] as const;
    userService.updateHomeTabs.mockReturnValue(of({ homeTabs: [...homeTabs] }));
    let publishedUserData: UserData;
    store.getUserData$().subscribe((data) => (publishedUserData = data));

    store.updateHomeTabs$([...homeTabs]).subscribe();

    expect(userService.updateHomeTabs).toHaveBeenCalledWith('owner', [
      ...homeTabs,
    ]);
    expect(userData.homeTabs).toEqual(homeTabs);
    expect(publishedUserData).toBe(userData);
  });

  it('removes a note favorite without changing bookmark favorites', () => {
    const response = new Subject<UserFavoriteMutation>();
    userService.updateUserFavorite.mockReturnValue(response.asObservable());

    store.toggleFavorite$('note', 'note-existing').subscribe();
    response.next({
      resourceType: 'note',
      resourceId: 'note-existing',
      favorite: false,
    });

    expect(userData.favoriteNotes).toEqual([]);
    expect(userData.favorites).toEqual(['bookmark-existing']);
    expect(userData.likes).toEqual(['bookmark-liked']);
  });

  it('removes note references locally without persisting user data', () => {
    userData.history = ['note-existing', 'bookmark-existing'];
    userData.pinned = [
      { type: 'note', id: 'note-existing' },
      { type: 'bookmark', id: 'bookmark-existing' },
    ];

    let publishedUserData: UserData;
    store.getUserData$().subscribe((data) => (publishedUserData = data));
    store.removeNoteLocally({
      _id: 'note-existing',
      type: 'note',
      title: 'Existing note',
      content: '',
      tags: [],
    });

    expect(userData.history).toEqual(['bookmark-existing']);
    expect(userData.pinned).toEqual([
      { type: 'bookmark', id: 'bookmark-existing' },
    ]);
    expect(userData.favoriteNotes).toEqual([]);
    expect(publishedUserData).toBe(userData);
    expect(userService.updateUserFavorite).not.toHaveBeenCalled();
    expect(userService.updateUserData).not.toHaveBeenCalled();
    expect(notifyStoresService.deleteNote).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'note-existing' })
    );
  });

  it('removes bookmark references locally and persists the cleanup', () => {
    userData.history = ['bookmark-existing', 'bookmark-other'];
    userData.pinned = [
      { type: 'bookmark', id: 'bookmark-existing' },
      { type: 'bookmark', id: 'bookmark-other' },
    ];
    userData.readLater = ['bookmark-existing', 'bookmark-other'];

    store.removeFromStoresAtDeletion({
      _id: 'bookmark-existing',
      type: 'bookmark',
      name: 'Existing bookmark',
      location: 'https://example.com',
      tags: [],
    });

    expect(userData.history).toEqual(['bookmark-other']);
    expect(userData.pinned).toEqual([
      { type: 'bookmark', id: 'bookmark-other' },
    ]);
    expect(userData.favorites).toEqual([]);
    expect(userData.readLater).toEqual(['bookmark-other']);
    expect(userData.likes).toEqual(['bookmark-liked']);
    expect(userService.updateUserData).toHaveBeenCalledWith(userData);
    expect(notifyStoresService.deleteBookmark).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'bookmark-existing' })
    );
  });
});
