import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthenticationService } from '../../core/auth/authentication.service';
import { PersonalNotesService } from '../../core/personal-notes.service';
import { DeleteNotificationService } from '../../core/notifications/delete-notification.service';
import { Note } from '../../core/model/note';
import { UserData } from '../../core/model/user-data';
import { UserInfoStore } from '../../core/user/user-info.store';
import { UserDataPinnedStore } from '../../core/user/userdata.pinned.store';
import { UserDataStore } from '../../core/user/userdata.store';
import { NoteDetailsComponent } from './note-details.component';

describe('NoteDetailsComponent favorites', () => {
  let authService: jasmine.SpyObj<AuthenticationService>;
  let dialog: { open: jasmine.Spy };
  let userDataStore: jasmine.SpyObj<UserDataStore>;
  let note: Note;
  let userData: UserData;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthenticationService>(
      'AuthenticationService',
      ['isLoggedIn']
    );
    authService.isLoggedIn.and.returnValue(true);
    dialog = {
      open: jasmine
        .createSpy('open')
        .and.returnValue({ afterClosed: () => of(null) }),
    };
    userDataStore = jasmine.createSpyObj<UserDataStore>(
      'UserDataStore',
      ['toggleFavorite$']
    );
    userDataStore.toggleFavorite$.and.returnValue(
      of({
        resourceType: 'note',
        resourceId: 'note-1',
        favorite: true,
      })
    );

    TestBed.configureTestingModule({
      imports: [NoteDetailsComponent],
      providers: [
        provideRouter([]),
        { provide: MatDialog, useValue: dialog },
        { provide: AuthenticationService, useValue: authService },
        { provide: UserDataStore, useValue: userDataStore },
        { provide: PersonalNotesService, useValue: {} },
        { provide: UserInfoStore, useValue: {} },
        { provide: UserDataPinnedStore, useValue: {} },
        { provide: DeleteNotificationService, useValue: {} },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } },
        },
      ],
    });

    note = {
      _id: 'note-1',
      type: 'note',
      title: 'Note',
      content: 'Note content',
      color: 'white',
      tags: [],
      userId: 'owner',
      public: true,
    };
    userData = {
      userId: 'owner',
      favorites: [],
      favoriteNotes: ['note-1'],
    };
  });

  it('reads favorite state from the note-specific ID list', () => {
    const fixture = TestBed.createComponent(NoteDetailsComponent);
    const component = fixture.componentInstance;

    expect(component.isFavorite(userData, note)).toBe(true);
    expect(
      component.isFavorite(
        { ...userData, favoriteNotes: [] },
        note
      )
    ).toBe(false);
  });

  it('sends note favorite mutations for signed-in users', () => {
    const fixture = TestBed.createComponent(NoteDetailsComponent);

    fixture.componentInstance.toggleFavorite(note);

    expect(userDataStore.toggleFavorite$).toHaveBeenCalledWith(
      'note',
      'note-1'
    );
  });

  it('prompts guests to log in without sending a mutation', () => {
    authService.isLoggedIn.and.returnValue(false);
    const fixture = TestBed.createComponent(NoteDetailsComponent);

    fixture.componentInstance.toggleFavorite(note);

    expect(dialog.open).toHaveBeenCalled();
    expect(userDataStore.toggleFavorite$).not.toHaveBeenCalled();
  });
});
