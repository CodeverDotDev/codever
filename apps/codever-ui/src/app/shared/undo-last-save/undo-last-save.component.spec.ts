import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import iziToast from 'izitoast';
import { UndoLastSaveComponent } from './undo-last-save.component';
import { PersonalBookmarksService } from '../../core/personal-bookmarks.service';
import { PersonalNotesService } from '../../core/personal-notes.service';
import { UserDataStore } from '../../core/user/userdata.store';
import { Bookmark } from '../../core/model/bookmark';
import { Note } from '../../core/model/note';

describe('UndoLastSaveComponent', () => {
  const beforeBookmark = {
    _id: 'b1',
    userId: 'owner',
    name: 'Old name',
    location: 'https://example.com',
    tags: [],
  } as Bookmark;
  let dialogResult: string;
  let dialog: { open: ReturnType<typeof vi.fn> };
  let bookmarks: { updateBookmark: ReturnType<typeof vi.fn> };
  let notes: { updateNote: ReturnType<typeof vi.fn> };
  let userDataStore: { updateUserDataHistory$: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    dialogResult = 'CONFIRM';
    dialog = { open: vi.fn(() => ({ afterClosed: () => of(dialogResult) })) };
    bookmarks = { updateBookmark: vi.fn((entry: Bookmark) => of(entry)) };
    notes = { updateNote: vi.fn((entry: Note) => of(entry)) };
    userDataStore = { updateUserDataHistory$: vi.fn(() => of({})) };
    TestBed.configureTestingModule({
      imports: [UndoLastSaveComponent],
      providers: [
        { provide: MatDialog, useValue: dialog },
        { provide: PersonalBookmarksService, useValue: bookmarks },
        { provide: PersonalNotesService, useValue: notes },
        { provide: UserDataStore, useValue: userDataStore },
      ],
    });
  });

  const render = (entryType: 'bookmark' | 'note', before: Bookmark | Note) => {
    const fixture = TestBed.createComponent(UndoLastSaveComponent);
    fixture.componentRef.setInput('entryType', entryType);
    fixture.componentRef.setInput('before', before);
    fixture.detectChanges();
    const undone = vi.fn();
    fixture.componentInstance.undone.subscribe(undone);
    const action = fixture.nativeElement.querySelector(
      '.undo-last-save-action'
    ) as HTMLButtonElement | null;
    return { fixture, undone, action };
  };

  it('writes the bookmark from before the save back after confirmation', () => {
    const { undone, action } = render('bookmark', beforeBookmark);
    expect(action?.textContent).toContain('Undo last save');

    action?.click();

    expect(dialog.open.mock.calls[0][1].data).toEqual({ entryTitle: 'Old name' });
    expect(bookmarks.updateBookmark).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'b1', name: 'Old name', description: null })
    );
    expect(userDataStore.updateUserDataHistory$).toHaveBeenCalled();
    expect(undone).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'b1', name: 'Old name' })
    );
  });

  it('writes a note back through the note update', () => {
    const { undone, action } = render('note', {
      _id: 'n1',
      userId: 'owner',
      title: 'Old',
      content: 'Important paragraph',
      tags: [],
    } as Note);

    action?.click();

    expect(notes.updateNote).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'n1', content: 'Important paragraph' })
    );
    expect(undone).toHaveBeenCalled();
  });

  it('changes nothing when the confirmation is cancelled', () => {
    dialogResult = 'CANCEL';
    const { undone, action } = render('bookmark', beforeBookmark);

    action?.click();

    expect(bookmarks.updateBookmark).not.toHaveBeenCalled();
    expect(undone).not.toHaveBeenCalled();
  });

  it('shows an error and keeps the action when the update fails', () => {
    const errorToast = vi.spyOn(iziToast, 'error').mockImplementation(() => undefined);
    bookmarks.updateBookmark.mockReturnValue(throwError(() => ({ status: 409 })));
    const { fixture, undone, action } = render('bookmark', beforeBookmark);

    action?.click();
    fixture.detectChanges();

    expect(errorToast).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Another user already has a public bookmark with this URL.',
      })
    );
    expect(undone).not.toHaveBeenCalled();
    expect(action?.disabled).toBe(false);
    errorToast.mockRestore();
  });
});
