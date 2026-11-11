import { MatDialog } from '@angular/material/dialog';
import { ScrollStrategyOptions } from '@angular/cdk/overlay';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
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
  let userInfoStore: Mocked<Pick<UserInfoStore, 'getUserId$'>>;
  let dialog: { open: ReturnType<typeof vi.fn> };
  let userDataStore: Mocked<
    Pick<
      UserDataStore,
      | 'toggleFavorite$'
      | 'updateUserDataHistory$'
      | 'getUserData$'
      | 'removeNoteLocally'
    >
  >;
  let personalNotesService: Mocked<
    Pick<PersonalNotesService, 'deleteNoteById'>
  >;
  let deleteNotificationService: Mocked<
    Pick<
      DeleteNotificationService,
      'showSuccessNotification' | 'showErrorNotification'
    >
  >;
  let note: Note;
  let userData: UserData;

  beforeEach(() => {
    authService = {
      isLoggedIn: vi.fn<AuthenticationService['isLoggedIn']>(),
    };
    authService.isLoggedIn.mockReturnValue(true);
    userInfoStore = {
      getUserId$: vi.fn<UserInfoStore['getUserId$']>().mockReturnValue(of('owner')),
    };
    dialog = {
      open: vi.fn().mockReturnValue({ afterClosed: () => of(null) }),
    };
    userDataStore = {
      toggleFavorite$: vi.fn<UserDataStore['toggleFavorite$']>(),
      updateUserDataHistory$: vi.fn<UserDataStore['updateUserDataHistory$']>(),
      getUserData$: vi
        .fn<UserDataStore['getUserData$']>()
        .mockReturnValue(of(userData)),
      removeNoteLocally: vi.fn<UserDataStore['removeNoteLocally']>(),
    };
    userDataStore.toggleFavorite$.mockReturnValue(
      of({
        resourceType: 'note',
        resourceId: 'note-1',
        favorite: true,
      })
    );
    personalNotesService = {
      deleteNoteById: vi
        .fn<PersonalNotesService['deleteNoteById']>()
        .mockReturnValue(of({})),
    };
    deleteNotificationService = {
      showSuccessNotification: vi.fn(),
      showErrorNotification: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [NoteDetailsComponent],
      providers: [
        provideRouter([]),
        { provide: MatDialog, useValue: dialog },
        { provide: ScrollStrategyOptions, useValue: { noop: () => ({}) } },
        { provide: AuthenticationService, useValue: authService },
        { provide: UserDataStore, useValue: userDataStore },
        { provide: PersonalNotesService, useValue: personalNotesService },
        { provide: UserInfoStore, useValue: userInfoStore },
        { provide: UserDataPinnedStore, useValue: {} },
        {
          provide: DeleteNotificationService,
          useValue: deleteNotificationService,
        },
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

  it('shows Delete only for the owner outside shared views', () => {
    const fixture = TestBed.createComponent(NoteDetailsComponent);
    const component = fixture.componentInstance;
    component.note$ = of(note);
    component.inSearchResults = true;
    component.partOfList = true;

    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[title="Delete note"]')
    ).not.toBeNull();

    component.partOfList = false;
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[title="Delete note"]')
    ).not.toBeNull();

    component.note$ = of({ ...note, userId: 'other', public: true });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[title="Delete note"]')
    ).toBeNull();

    component.isSharedView = true;
    component.note$ = of(note);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[title="Delete note"]')
    ).toBeNull();

    component.isSharedView = false;
    authService.isLoggedIn.mockReturnValue(false);
    const anonymousFixture = TestBed.createComponent(NoteDetailsComponent);
    anonymousFixture.componentInstance.note$ = of(note);
    anonymousFixture.componentInstance.inSearchResults = true;
    anonymousFixture.detectChanges();
    expect(
      anonymousFixture.nativeElement.querySelector('[title="Delete note"]')
    ).toBeNull();
  });

  it('requires confirmation before deleting a note', () => {
    const fixture = TestBed.createComponent(NoteDetailsComponent);
    const component = fixture.componentInstance;
    component.userId$ = of('owner');
    dialog.open.mockReturnValue({
      afterClosed: () => of('DELETE_CANCELED'),
    });

    component.openDeleteDialog(note);

    expect(dialog.open).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        disableClose: true,
        data: {
          resourceName: note.title,
          type: 'note',
          isPublic: note.public,
        },
      })
    );
    expect(personalNotesService.deleteNoteById).not.toHaveBeenCalled();
  });

  it('deletes a confirmed list note and emits it after local cleanup', () => {
    const fixture = TestBed.createComponent(NoteDetailsComponent);
    const component = fixture.componentInstance;
    component.userId$ = of('owner');
    component.partOfList = true;
    const deleted = vi.fn();
    component.noteDeleted.subscribe(deleted);

    component.deleteNote(note);

    expect(personalNotesService.deleteNoteById).toHaveBeenCalledWith(
      'owner',
      'note-1'
    );
    expect(userDataStore.removeNoteLocally).toHaveBeenCalledWith(note);
    expect(deleted).toHaveBeenCalledWith(note);
    expect(
      deleteNotificationService.showSuccessNotification
    ).toHaveBeenCalledWith('Note - "Note" was deleted');
  });

  it('navigates home after deleting a details-page note', () => {
    const fixture = TestBed.createComponent(NoteDetailsComponent);
    const component = fixture.componentInstance;
    component.userId$ = of('owner');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');

    component.deleteNote(note);

    expect(navigate).toHaveBeenCalledWith(['']);
  });

  it('keeps a note in place and shows an error when deletion fails', () => {
    personalNotesService.deleteNoteById.mockReturnValue(
      throwError(() => new Error('failed'))
    );
    const fixture = TestBed.createComponent(NoteDetailsComponent);
    const component = fixture.componentInstance;
    component.userId$ = of('owner');
    component.partOfList = true;
    const deleted = vi.fn();
    component.noteDeleted.subscribe(deleted);

    component.deleteNote(note);

    expect(userDataStore.removeNoteLocally).not.toHaveBeenCalled();
    expect(deleted).not.toHaveBeenCalled();
    expect(
      deleteNotificationService.showErrorNotification
    ).toHaveBeenCalledWith('Note could not be deleted. Please try again later!');
  });
});
