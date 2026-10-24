import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthenticationService } from '../../core/auth/authentication.service';
import { PersonalNotesService } from '../../core/personal-notes.service';
import { DeleteNotificationService } from '../../core/notifications/delete-notification.service';
import { Note } from '../../core/model/note';
import { SharedNote } from '../../core/model/share-link';
import { UserData } from '../../core/model/user-data';
import { UserInfoStore } from '../../core/user/user-info.store';
import { UserDataPinnedStore } from '../../core/user/userdata.pinned.store';
import { UserDataStore } from '../../core/user/userdata.store';
import { NoteDetailsComponent } from './note-details.component';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';

describe('NoteDetailsComponent favorites', () => {
  let authService: Mocked<Pick<AuthenticationService, 'isLoggedIn'>>;
  let dialog: { open: ReturnType<typeof vi.fn> };
  let userDataStore: Mocked<
    Pick<UserDataStore, 'toggleFavorite$' | 'updateUserDataHistory$'>
  >;
  let note: Note;
  let userData: UserData;

  beforeEach(() => {
    authService = {
      isLoggedIn: vi.fn<AuthenticationService['isLoggedIn']>(),
    };
    authService.isLoggedIn.mockReturnValue(true);
    dialog = {
      open: vi.fn().mockReturnValue({ afterClosed: () => of(null) }),
    };
    userDataStore = {
      toggleFavorite$: vi.fn<UserDataStore['toggleFavorite$']>(),
      updateUserDataHistory$: vi.fn<UserDataStore['updateUserDataHistory$']>(),
    };
    userDataStore.toggleFavorite$.mockReturnValue(
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
    authService.isLoggedIn.mockReturnValue(false);
    const fixture = TestBed.createComponent(NoteDetailsComponent);

    fixture.componentInstance.toggleFavorite(note);

    expect(dialog.open).toHaveBeenCalled();
    expect(userDataStore.toggleFavorite$).not.toHaveBeenCalled();
  });

  it('keeps shared notes outside owner identity and history behavior', () => {
    authService.isLoggedIn.mockReturnValue(true);
    const fixture = TestBed.createComponent(NoteDetailsComponent);
    const component = fixture.componentInstance;
    const sharedNote: SharedNote = {
      _id: 'note-1',
      type: 'note',
      title: 'Shared note',
      content: 'Shared content',
      contentType: 'markdown',
      tags: [],
    };
    component.isSharedView = true;
    component.note$ = of(sharedNote);

    fixture.detectChanges();

    expect(authService.isLoggedIn).not.toHaveBeenCalled();
    expect(userDataStore.updateUserDataHistory$).not.toHaveBeenCalled();
    expect(component.userId$).toBeDefined();
    expect(component.noteId).toBeUndefined();
    expect(
      fixture.nativeElement.querySelector('.favorite-star-toggle')
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('[title="Edit note"]')
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('[title="Share via email or on social media"]')
    ).toBeNull();
  });

  it('keeps shared notes read-only for signed-out viewers', () => {
    authService.isLoggedIn.mockReturnValue(false);
    const fixture = TestBed.createComponent(NoteDetailsComponent);
    const component = fixture.componentInstance;
    component.isSharedView = true;
    component.note$ = of({
      _id: 'note-1',
      type: 'note',
      title: 'Shared note',
      content: 'Shared content',
      contentType: 'markdown',
      tags: [],
    });

    fixture.detectChanges();

    expect(authService.isLoggedIn).not.toHaveBeenCalled();
    expect(userDataStore.updateUserDataHistory$).not.toHaveBeenCalled();
    expect(
      fixture.nativeElement.querySelector('.favorite-star-toggle')
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('[title="Edit note"]')
    ).toBeNull();
  });

  it('preserves shared notebook source for copy and original download', async () => {
    const fixture = TestBed.createComponent(NoteDetailsComponent);
    const component = fixture.componentInstance;
    const source = '{"cells":[{"cell_type":"markdown","source":["shared"]}]}';
    const sharedNotebook: SharedNote = {
      _id: 'note-1',
      type: 'note',
      title: 'Shared notebook',
      content: 'shared',
      contentType: 'notebook',
      notebookContent: source,
      tags: [],
    };
    const clipboardWrite = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWrite },
    });
    const previousCreateObjectURL = Object.getOwnPropertyDescriptor(
      window.URL,
      'createObjectURL'
    );
    const previousRevokeObjectURL = Object.getOwnPropertyDescriptor(
      window.URL,
      'revokeObjectURL'
    );
    const createObjectURL = vi.fn().mockReturnValue('blob:shared-notebook');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(window.URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(window.URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        expect(this.download).toBe('Shared notebook.ipynb');
      });

    component.copyNoteMarkdown(sharedNotebook);
    component.downloadNotebook(sharedNotebook);

    expect(clipboardWrite).toHaveBeenCalledWith('shared');
    expect(createObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'application/x-ipynb+json',
        size: new Blob([source]).size,
      })
    );
    expect(click).toHaveBeenCalledOnce();
    const notebookBlob = createObjectURL.mock.calls[0][0] as Blob;
    expect(await notebookBlob.text()).toBe(source);

    if (previousCreateObjectURL) {
      Object.defineProperty(window.URL, 'createObjectURL', previousCreateObjectURL);
    } else {
      Reflect.deleteProperty(window.URL, 'createObjectURL');
    }
    if (previousRevokeObjectURL) {
      Object.defineProperty(window.URL, 'revokeObjectURL', previousRevokeObjectURL);
    } else {
      Reflect.deleteProperty(window.URL, 'revokeObjectURL');
    }
  });
});
