import { Bookmark } from '../../../core/model/bookmark';
import { Note } from '../../../core/model/note';
import { MainLinkShortcutService } from '../../../core/shortcut/main-link-shortcut.service';
import {
  CollectionContentsDialogComponent,
  CollectionContentsDialogData,
} from './collection-contents-dialog.component';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type ShortcutMock = MainLinkShortcutService & {
  activateResource: ReturnType<typeof vi.fn>;
  openBookmarkInNewTab: ReturnType<typeof vi.fn>;
  register: ReturnType<typeof vi.fn>;
  unregister: ReturnType<typeof vi.fn>;
};

/**
 * Focused tests for the collection contents dialog's `Enter` handler. Like the
 * other filters it resolves the single visible result across both lists and
 * delegates to `MainLinkShortcutService.activateResource`.
 */
describe('CollectionContentsDialogComponent Enter handler', () => {
  let component: CollectionContentsDialogComponent;
  let shortcut: ShortcutMock;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  const bookmark = (id: string): Bookmark =>
    ({
      _id: id,
      name: `Bookmark ${id}`,
      location: `https://example.com/${id}`,
      type: 'bookmark',
      tags: [],
    } as Bookmark);
  const note = (id: string): Note =>
    ({ _id: id, title: `Note ${id}`, type: 'note', tags: [] } as Note);

  const data: CollectionContentsDialogData = {
    userId: 'u1',
    collectionId: 'c1',
    collectionName: 'My collection',
  };

  beforeEach(() => {
    shortcut = Object.assign(
      new MainLinkShortcutService({} as never, {} as never),
      {
        activateResource:
          vi.fn<MainLinkShortcutService['activateResource']>(),
        openBookmarkInNewTab:
          vi.fn<MainLinkShortcutService['openBookmarkInNewTab']>(),
        register: vi.fn<MainLinkShortcutService['register']>(),
        unregister: vi.fn<MainLinkShortcutService['unregister']>(),
      }
    );
    dialogRef = { close: vi.fn() };
    component = new CollectionContentsDialogComponent(
      {} as never,
      data,
      dialogRef as never,
      shortcut
    );
  });

  const setVisible = (bookmarks: Bookmark[], notes: Note[]) => {
    component.filteredBookmarks = bookmarks;
    component.filteredNotes = notes;
  };

  it('activates the only visible bookmark', () => {
    setVisible([bookmark('b')], []);

    component.onFilterEnter();

    expect(shortcut.activateResource).toHaveBeenCalledTimes(1);
    const args = shortcut.activateResource.mock.lastCall!;
    expect((args[0] as Bookmark)._id).toBe('b');
    expect(args[1]).toBe(true);
    expect(args[2]).toEqual(['bookmark', 'note']);
    expect(dialogRef.close).toHaveBeenCalledTimes(0);
  });

  it('activates the only visible note and closes the dialog', () => {
    shortcut.activateResource.mockReturnValue('navigated');
    setVisible([], [note('n')]);

    component.onFilterEnter();

    const args = shortcut.activateResource.mock.lastCall!;
    expect((args[0] as Note)._id).toBe('n');
    expect(dialogRef.close).toHaveBeenCalledTimes(1);
  });

  it('does nothing when a bookmark and a note are both visible', () => {
    setVisible([bookmark('b')], [note('n')]);

    component.onFilterEnter();

    expect(shortcut.activateResource).toHaveBeenCalledTimes(0);
  });

  it('does nothing when nothing is visible', () => {
    setVisible([], []);

    component.onFilterEnter();

    expect(shortcut.activateResource).toHaveBeenCalledTimes(0);
  });

  it('does nothing for multiple visible bookmarks', () => {
    setVisible([bookmark('a'), bookmark('b')], []);

    component.onFilterEnter();

    expect(shortcut.activateResource).toHaveBeenCalledTimes(0);
  });

  it('names the target type in the hint and stays silent when ambiguous', () => {
    setVisible([bookmark('b')], []);
    expect(component.filterActivationHint).toBe('bookmark');

    setVisible([], [note('n')]);
    expect(component.filterActivationHint).toBe('note');

    setVisible([bookmark('b')], [note('n')]);
    expect(component.filterActivationHint).toBeNull();
  });
});
