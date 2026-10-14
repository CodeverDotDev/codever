import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Bookmark } from '../model/bookmark';
import { Note } from '../model/note';
import { PinnedCollection } from '../model/collection';
import { AddToHistoryService } from '../user/add-to-history.service';
import {
  BookmarkShortcutContext,
  MAIN_LINK_SHORTCUT_PRIORITY,
  MainLinkShortcutService,
} from './main-link-shortcut.service';

describe('MainLinkShortcutService', () => {
  let service: MainLinkShortcutService;
  let addToHistory: jasmine.SpyObj<AddToHistoryService>;
  let router: jasmine.SpyObj<Pick<Router, 'navigate'>>;

  const bookmark = (id: string): Bookmark =>
    ({
      _id: id,
      name: `Bookmark ${id}`,
      location: `https://example.com/${id}`,
      type: 'bookmark',
      tags: [],
      userDisplayName: 'tester',
    } as Bookmark);

  const context = (
    priority: number,
    single: Bookmark | null,
    userIsLoggedIn = false
  ): BookmarkShortcutContext => ({
    priority,
    getSingleVisibleBookmark: () => single,
    isUserLoggedIn: () => userIsLoggedIn,
  });

  const keydown = (
    init: KeyboardEventInit & { target?: EventTarget }
  ): KeyboardEvent => {
    const { target, ...eventInit } = init;
    const event = new KeyboardEvent('keydown', {
      cancelable: true,
      ...eventInit,
    });
    if (target) {
      Object.defineProperty(event, 'target', { value: target });
    }
    return event;
  };

  beforeEach(() => {
    jasmine.clock().install();
    // Control Date.now() too: the service measures the gap between the two `k`
    // presses with Date.now(), which clock().tick() only advances once the date
    // is mocked.
    jasmine.clock().mockDate(new Date(2020, 0, 1, 0, 0, 0));
    addToHistory = jasmine.createSpyObj<AddToHistoryService>(
      'AddToHistoryService',
      ['promoteInHistoryIfLoggedIn']
    );
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        MainLinkShortcutService,
        { provide: AddToHistoryService, useValue: addToHistory },
        { provide: Router, useValue: router },
      ],
    });

    service = TestBed.inject(MainLinkShortcutService);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('opens the single visible bookmark when k is pressed twice in time', () => {
    const open = spyOn(window, 'open');
    service.register(
      context(MAIN_LINK_SHORTCUT_PRIORITY.DETAILS, bookmark('a'), true)
    );

    expect(service.handleKeydown(keydown({ key: 'k' }))).toBeFalse();
    jasmine.clock().tick(200);
    const second = keydown({ key: 'k' });
    expect(service.handleKeydown(second)).toBeTrue();

    expect(open.calls.count()).toBe(1);
    expect(open.calls.mostRecent().args).toEqual([
      'https://example.com/a',
      '_blank',
    ]);
    expect(addToHistory.promoteInHistoryIfLoggedIn.calls.count()).toBe(1);
    const promoteArgs =
      addToHistory.promoteInHistoryIfLoggedIn.calls.mostRecent().args;
    expect(promoteArgs[0]).toBeTrue();
    expect((promoteArgs[1] as Bookmark)._id).toBe('a');
    expect(second.defaultPrevented).toBeTrue();
  });

  it('does not open when the second k is late (past the timeout)', () => {
    const open = spyOn(window, 'open');
    service.register(
      context(MAIN_LINK_SHORTCUT_PRIORITY.DETAILS, bookmark('a'))
    );

    service.handleKeydown(keydown({ key: 'k' }));
    jasmine.clock().tick(MainLinkShortcutService.SEQUENCE_TIMEOUT_MS + 1);
    expect(service.handleKeydown(keydown({ key: 'k' }))).toBeFalse();

    expect(open).not.toHaveBeenCalled();
  });

  it('ignores auto-repeat keydown events', () => {
    const open = spyOn(window, 'open');
    service.register(
      context(MAIN_LINK_SHORTCUT_PRIORITY.DETAILS, bookmark('a'))
    );

    service.handleKeydown(keydown({ key: 'k' }));
    jasmine.clock().tick(50);
    expect(
      service.handleKeydown(keydown({ key: 'k', repeat: true }))
    ).toBeFalse();

    expect(open).not.toHaveBeenCalled();
  });

  it('resets the sequence when a non-k key interrupts it', () => {
    const open = spyOn(window, 'open');
    service.register(
      context(MAIN_LINK_SHORTCUT_PRIORITY.DETAILS, bookmark('a'))
    );

    service.handleKeydown(keydown({ key: 'k' }));
    jasmine.clock().tick(50);
    service.handleKeydown(keydown({ key: 'x' }));
    jasmine.clock().tick(50);
    // This is now only the first k of a fresh sequence.
    expect(service.handleKeydown(keydown({ key: 'k' }))).toBeFalse();

    expect(open).not.toHaveBeenCalled();
  });

  it('does not fire while an editable control has focus', () => {
    const open = spyOn(window, 'open');
    service.register(
      context(MAIN_LINK_SHORTCUT_PRIORITY.DETAILS, bookmark('a'))
    );
    const input = document.createElement('input');

    service.handleKeydown(keydown({ key: 'k', target: input }));
    jasmine.clock().tick(100);
    expect(
      service.handleKeydown(keydown({ key: 'k', target: input }))
    ).toBeFalse();

    expect(open).not.toHaveBeenCalled();
  });

  it('ignores k when a control/meta/alt modifier is held', () => {
    const open = spyOn(window, 'open');
    service.register(
      context(MAIN_LINK_SHORTCUT_PRIORITY.DETAILS, bookmark('a'))
    );

    service.handleKeydown(keydown({ key: 'k', ctrlKey: true }));
    jasmine.clock().tick(100);
    expect(
      service.handleKeydown(keydown({ key: 'k', ctrlKey: true }))
    ).toBeFalse();

    expect(open).not.toHaveBeenCalled();
  });

  it('does nothing when no context is registered', () => {
    const open = spyOn(window, 'open');

    service.handleKeydown(keydown({ key: 'k' }));
    jasmine.clock().tick(100);
    expect(service.handleKeydown(keydown({ key: 'k' }))).toBeFalse();

    expect(open).not.toHaveBeenCalled();
  });

  it('does nothing when the active context has no single bookmark (zero/multiple/note)', () => {
    const open = spyOn(window, 'open');
    // null models zero, multiple, or note-only - the provider returns null.
    service.register(context(MAIN_LINK_SHORTCUT_PRIORITY.SEARCH, null));

    service.handleKeydown(keydown({ key: 'k' }));
    jasmine.clock().tick(100);
    expect(service.handleKeydown(keydown({ key: 'k' }))).toBeFalse();

    expect(open).not.toHaveBeenCalled();
  });

  it('consults only the highest-priority context (details over search)', () => {
    service.register(
      context(MAIN_LINK_SHORTCUT_PRIORITY.SEARCH, bookmark('search'))
    );
    service.register(
      context(MAIN_LINK_SHORTCUT_PRIORITY.DETAILS, bookmark('details'))
    );

    const resolved = service.resolveActiveContextBookmark();

    expect(resolved?.bookmark._id).toBe('details');
  });

  it('returns null from the top context even if a lower one could resolve', () => {
    service.register(
      context(MAIN_LINK_SHORTCUT_PRIORITY.SEARCH, bookmark('search'))
    );
    service.register(context(MAIN_LINK_SHORTCUT_PRIORITY.DIALOG, null));

    expect(service.resolveActiveContextBookmark()).toBeNull();
  });

  it('stops resolving a context once it is unregistered', () => {
    const ctx = context(MAIN_LINK_SHORTCUT_PRIORITY.DETAILS, bookmark('a'));
    service.register(ctx);
    service.unregister(ctx);

    expect(service.resolveActiveContextBookmark()).toBeNull();
  });

  it('opens a new tab and promotes history once via openBookmarkInNewTab', () => {
    const open = spyOn(window, 'open');

    service.openBookmarkInNewTab(bookmark('z'), true);

    expect(open.calls.count()).toBe(1);
    expect(open.calls.mostRecent().args).toEqual([
      'https://example.com/z',
      '_blank',
    ]);
    expect(addToHistory.promoteInHistoryIfLoggedIn.calls.count()).toBe(1);
    const promoteArgs =
      addToHistory.promoteInHistoryIfLoggedIn.calls.mostRecent().args;
    expect(promoteArgs[0]).toBeTrue();
    expect((promoteArgs[1] as Bookmark)._id).toBe('z');
  });

  it('does not promote history when the user is not logged in', () => {
    spyOn(window, 'open');

    service.openBookmarkInNewTab(bookmark('z'), false);

    expect(addToHistory.promoteInHistoryIfLoggedIn.calls.count()).toBe(1);
    const promoteArgs =
      addToHistory.promoteInHistoryIfLoggedIn.calls.mostRecent().args;
    expect(promoteArgs[0]).toBeFalse();
    expect((promoteArgs[1] as Bookmark)._id).toBe('z');
  });

  describe('activateResource', () => {
    const note = (id: string, isPublic = false): Note =>
      ({
        _id: id,
        title: `Note ${id}`,
        type: 'note',
        content: '',
        color: '',
        tags: [],
        public: isPublic,
      } as Note);

    const collection = (id: string): PinnedCollection =>
      ({ _id: id, name: `Collection ${id}`, type: 'collection' } as never);

    const ALL = ['bookmark', 'note', 'collection'] as const;

    it('opens an activatable bookmark in a new tab and does not navigate', () => {
      const open = spyOn(window, 'open');

      const outcome = service.activateResource(bookmark('b'), true, ALL);

      expect(outcome).toBe('new-tab');
      expect(open.calls.mostRecent().args).toEqual([
        'https://example.com/b',
        '_blank',
      ]);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('navigates to the personal note route with the note as router state', () => {
      const aNote = note('n');

      const outcome = service.activateResource(aNote, true, ALL);

      expect(outcome).toBe('navigated');
      expect(router.navigate.calls.mostRecent().args).toEqual([
        ['/my-notes', 'n', 'details'],
        { state: { note: aNote } },
      ]);
    });

    it('navigates to the public note route for a public note', () => {
      service.activateResource(note('n', true), true, ALL);

      expect(router.navigate.calls.mostRecent().args[0]).toEqual([
        '/notes',
        'n',
        'details',
      ]);
    });

    it('navigates to the collection details route', () => {
      const outcome = service.activateResource(collection('c'), true, ALL);

      expect(outcome).toBe('navigated');
      expect(router.navigate.calls.mostRecent().args[0]).toEqual([
        '/my-collections',
        'c',
      ]);
    });

    it('does nothing for a type the caller does not activate', () => {
      const open = spyOn(window, 'open');

      expect(
        service.activateResource(note('n'), true, ['bookmark'])
      ).toBeNull();
      expect(
        service.activateResource(collection('c'), true, ['bookmark'])
      ).toBeNull();

      expect(router.navigate).not.toHaveBeenCalled();
      expect(open).not.toHaveBeenCalled();
    });

    it('does nothing when the resource has no target id', () => {
      expect(service.activateResource(note(''), true, ALL)).toBeNull();
      expect(
        service.activateResource(
          { name: 'No id', type: 'collection' } as PinnedCollection,
          true,
          ALL
        )
      ).toBeNull();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('does nothing when the bookmark has no location', () => {
      const open = spyOn(window, 'open');

      expect(
        service.activateResource(
          { _id: 'b', name: 'No location', type: 'bookmark' } as Bookmark,
          true,
          ALL
        )
      ).toBeNull();
      expect(open).not.toHaveBeenCalled();
    });

    it('does nothing for a missing resource', () => {
      expect(service.activateResource(null, true, ALL)).toBeNull();
      expect(service.activateResource(undefined, true, ALL)).toBeNull();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
