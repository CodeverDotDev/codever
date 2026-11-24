import { describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { SaveBookmarkFormComponent } from './save-bookmark-form.component';
import { Bookmark } from '../../core/model/bookmark';

/**
 * After an edited bookmark is saved, the owner lands on its details page,
 * which shows the result and offers "Undo last save" with the bookmark as it
 * was loaded; the editor is replaced in the browser history, so Back returns
 * to where the edit started.
 */
const editorFor = (options: { isAdmin: boolean; ownerId: string }) => {
  const updateBookmark = vi.fn((bookmark: Bookmark) => of(bookmark));
  const adminUpdate = vi.fn((bookmark: Bookmark) => of(bookmark));
  const navigate = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private members of a large form component, set up without its 25 constructor dependencies
  const editor: any = Object.create(SaveBookmarkFormComponent.prototype);
  Object.assign(editor, {
    userId: 'me',
    bookmark: { _id: 'b1', userId: options.ownerId, userDisplayName: 'Owner' },
    bookmarkBeforeEdit: { _id: 'b1', name: 'Before edit' },
    markdownService: { toHtml: () => '<p>d</p>' },
    keycloakService: { isUserInRole: () => options.isAdmin },
    personalBookmarksService: { updateBookmark },
    adminService: { updateBookmark: adminUpdate },
    userDataStore: { updateUserDataHistory$: () => of({}) },
    router: { navigate },
  });
  return { editor, adminUpdate, navigate };
};

const edited = (): Bookmark =>
  ({ name: 'Edited', location: 'https://example.com', description: 'd', tags: [] }) as Bookmark;

describe('After saving an edited bookmark', () => {
  it('opens the details page in place of the editor, with the undo', () => {
    const { editor, navigate } = editorFor({ isAdmin: false, ownerId: 'me' });

    editor.updateBookmark(edited());

    expect(navigate).toHaveBeenCalledWith(
      ['./my-bookmarks/b1/details'],
      expect.objectContaining({
        replaceUrl: true,
        state: {
          bookmark: expect.objectContaining({ _id: 'b1', name: 'Edited' }),
          undoLastSave: { _id: 'b1', name: 'Before edit' },
        },
      })
    );
  });

  it('keeps the history list for an admin edit of another user bookmark', () => {
    const { editor, adminUpdate, navigate } = editorFor({
      isAdmin: true,
      ownerId: 'someone-else',
    });

    editor.updateBookmark(edited());

    expect(adminUpdate).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/history']);
  });
});
