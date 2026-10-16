import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { LocalStorageService } from '../cache/local-storage.service';
import { PersonalBookmarksService } from '../personal-bookmarks.service';
import { UserFavoriteMutation, UserData } from '../model/user-data';
import { UserDataService } from '../user-data.service';
import { NotifyStoresService } from './notify-stores.service';
import { UserDataHistoryStore } from './userdata.history.store';
import { UserDataStore } from './userdata.store';

describe('UserDataStore favorites', () => {
  let store: UserDataStore;
  let userService: jasmine.SpyObj<UserDataService>;
  let userData: UserData;

  beforeEach(() => {
    userService = jasmine.createSpyObj<UserDataService>('UserDataService', [
      'getUserData',
      'updateUserFavorite',
    ]);
    userData = {
      userId: 'owner',
      searches: [],
      favorites: ['bookmark-existing'],
      favoriteNotes: ['note-existing'],
      likes: ['bookmark-liked'],
    };
    userService.getUserData.and.returnValue(of(userData));

    TestBed.configureTestingModule({
      providers: [
        UserDataStore,
        { provide: UserDataService, useValue: userService },
        { provide: NotifyStoresService, useValue: {} },
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
    userService.updateUserFavorite.and.returnValue(response.asObservable());

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

  it('removes a note favorite without changing bookmark favorites', () => {
    const response = new Subject<UserFavoriteMutation>();
    userService.updateUserFavorite.and.returnValue(response.asObservable());

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
});
