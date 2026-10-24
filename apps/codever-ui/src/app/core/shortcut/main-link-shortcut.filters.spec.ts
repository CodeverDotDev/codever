import { Bookmark } from '../model/bookmark';
import { Note } from '../model/note';
import { UserDataResource } from '../model/user-data-resource.type';
import { MainLinkShortcutService } from './main-link-shortcut.service';
import { ActivatableType } from './resource-activation.util';
import { QuickAccessResourcesComponent } from '../../left-navigation-menu/quick-access-resources.component';
import { HotKeysDialogComponent } from '../../shared/dialog/history-dialog/hot-keys-dialog.component';
import { MyCollectionsPageComponent } from '../../my-collections/my-collections-page.component';
import { CollectionDetailComponent } from '../../my-collections/collection-detail/collection-detail.component';
import { Collection, PinnedCollection } from '../model/collection';
import { AsyncSearchResultListComponent } from '../../shared/async-search-result-list/async-search-result-list.component';
import { AuthenticationService } from '../auth/authentication.service';
import { ActivatedRoute } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Focused tests for the per-filter `Enter` handlers. Every surface now resolves
 * its single visible result and delegates to
 * `MainLinkShortcutService.activateResource`, so these tests assert the
 * delegation (which resource, whether the user is logged in, and which types
 * the surface declares) rather than the per-type routing, which is covered by
 * `main-link-shortcut.service.spec.ts`.
 */
const bookmark = (id: string, name = `Bookmark ${id}`): Bookmark =>
  ({
    _id: id,
    name,
    location: `https://example.com/${id}`,
    type: 'bookmark',
    tags: [],
  } as Bookmark);
const note = (id: string, title = `Note ${id}`): Note =>
  ({
    _id: id,
    title,
    type: 'note',
    tags: [],
  } as Note);
const collection = (id: string, displayName = `Collection ${id}`): Collection =>
  ({ _id: id, name: displayName } as Collection);
const pinnedCollection = (
  id: string,
  displayName = `Collection ${id}`
): PinnedCollection =>
  ({ _id: id, name: displayName, type: 'collection' } as PinnedCollection);
const ALL_TYPES: ActivatableType[] = ['bookmark', 'note', 'collection'];
function shortcutSpy() {
  const service = new MainLinkShortcutService({} as never, {} as never);
  return Object.assign(service, {
    openBookmarkInNewTab: vi.spyOn(service, 'openBookmarkInNewTab'),
    activateResource: vi
      .spyOn(service, 'activateResource')
      .mockImplementation(() => null),
    register: vi.spyOn(service, 'register'),
    unregister: vi.spyOn(service, 'unregister'),
  });
}
/** Assert the shortcut was asked to activate exactly the expected resource. */
function expectActivated(
  shortcut: ReturnType<typeof shortcutSpy>,
  id: string,
  userIsLoggedIn: boolean,
  types: ActivatableType[]
): void {
  expect(shortcut.activateResource).toHaveBeenCalledTimes(1);
  const args = shortcut.activateResource.mock.calls[0];
  expect((args[0] as UserDataResource)._id).toBe(id);
  expect(args[1]).toBe(userIsLoggedIn);
  expect(args[2]).toEqual(types);
}
describe('QuickAccessResourcesComponent Enter handler', () => {
  let component: QuickAccessResourcesComponent;
  let shortcut: ReturnType<typeof shortcutSpy>;
  beforeEach(() => {
    shortcut = shortcutSpy();
    component = new QuickAccessResourcesComponent(
      {} as never,
      {} as never,
      {} as never,
      shortcut,
      { getUserId$: () => ({ subscribe: () => undefined }) } as never,
      {} as never
    );
  });
  const setResources = (resources: UserDataResource[], filter = '') => {
    component.quickAccessResources = resources;
    component.pinnedFilterText = filter;
  };
  it('activates the only visible bookmark', () => {
    setResources([bookmark('a'), bookmark('b')], 'Bookmark a');
    component.onFilterEnter();
    expectActivated(shortcut, 'a', true, ALL_TYPES);
  });
  it('activates the only visible note', () => {
    setResources([note('n'), bookmark('a')], 'Note n');
    component.onFilterEnter();
    expectActivated(shortcut, 'n', true, ALL_TYPES);
  });
  it('activates the only visible collection', () => {
    setResources([pinnedCollection('c'), bookmark('a')], 'Collection c');
    component.onFilterEnter();
    expectActivated(shortcut, 'c', true, ALL_TYPES);
  });
  it('does nothing when multiple entries are visible', () => {
    setResources([bookmark('a'), bookmark('b')], '');
    component.onFilterEnter();
    expect(shortcut.activateResource).not.toHaveBeenCalled();
  });
  it('does nothing when nothing matches the filter', () => {
    setResources([bookmark('a')], 'zzz');
    component.onFilterEnter();
    expect(shortcut.activateResource).not.toHaveBeenCalled();
  });
  it('reports the hint per type and nothing when ambiguous', () => {
    setResources([bookmark('a')], '');
    expect(component.filterActivationHint).toBe('bookmark');
    setResources([note('n')], '');
    expect(component.filterActivationHint).toBe('note');
    setResources([pinnedCollection('c')], '');
    expect(component.filterActivationHint).toBe('collection');
    setResources([bookmark('a'), note('n')], '');
    expect(component.filterActivationHint).toBeNull();
  });
});
describe('HotKeysDialogComponent Enter handler', () => {
  let component: HotKeysDialogComponent;
  let shortcut: ReturnType<typeof shortcutSpy>;
  let dialogRef: { close: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    shortcut = shortcutSpy();
    dialogRef = { close: vi.fn() };
    component = new HotKeysDialogComponent(
      dialogRef as never,
      {} as never,
      shortcut,
      {
        resources$: { subscribe: () => ({ unsubscribe: () => undefined }) },
        title: 'Pinned',
      } as never
    );
  });
  const setResources = (resources: UserDataResource[], filter = '') => {
    (component as unknown as { resources: UserDataResource[] }).resources =
      resources;
    component.filterText = filter as '';
  };
  it('activates the only visible bookmark (always logged in)', () => {
    setResources([bookmark('a'), note('n')], 'Bookmark a');
    component.onFilterEnter();
    expectActivated(shortcut, 'a', true, ALL_TYPES);
  });
  it('activates the only visible note and closes the dialog', () => {
    shortcut.activateResource.mockReturnValue('navigated');
    setResources([note('n'), bookmark('a')], 'Note n');
    component.onFilterEnter();
    expectActivated(shortcut, 'n', true, ALL_TYPES);
    expect(dialogRef.close).toHaveBeenCalledTimes(1);
  });
  it('activates the only visible collection and closes the dialog', () => {
    shortcut.activateResource.mockReturnValue('navigated');
    setResources([pinnedCollection('c'), bookmark('a')], 'Collection c');
    component.onFilterEnter();
    expectActivated(shortcut, 'c', true, ALL_TYPES);
    expect(dialogRef.close).toHaveBeenCalledTimes(1);
  });
  it('keeps the dialog open when a bookmark opens in a new tab', () => {
    shortcut.activateResource.mockReturnValue('new-tab');
    setResources([bookmark('a'), note('n')], 'Bookmark a');
    component.onFilterEnter();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });
  it('does nothing for zero or multiple results', () => {
    setResources([bookmark('a'), bookmark('b')], '');
    component.onFilterEnter();
    setResources([bookmark('a')], 'zzz');
    component.onFilterEnter();
    expect(shortcut.activateResource).not.toHaveBeenCalled();
  });
  it('names the target type in the hint', () => {
    setResources([note('n')], '');
    expect(component.filterActivationHint).toBe('note');
    setResources([bookmark('a'), bookmark('b')], '');
    expect(component.filterActivationHint).toBeNull();
  });
});
describe('MyCollectionsPageComponent Enter handler', () => {
  let component: MyCollectionsPageComponent;
  let shortcut: ReturnType<typeof shortcutSpy>;
  beforeEach(() => {
    shortcut = shortcutSpy();
    component = new MyCollectionsPageComponent(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      { getUserData$: () => undefined } as never,
      {} as never,
      shortcut
    );
  });
  it('activates the only visible collection', () => {
    component.collections = [collection('x')];
    component.onFilterEnter();
    expectActivated(shortcut, 'x', false, ['collection']);
    const activated = shortcut.activateResource.mock.calls[0][0] as
      | PinnedCollection
      | null
      | undefined;
    expect(activated).toBeDefined();
    expect(activated.name).toBe('Collection x');
    expect(activated.type).toBe('collection');
  });
  it('does nothing for zero collections', () => {
    component.collections = [];
    component.onFilterEnter();
    expect(shortcut.activateResource).not.toHaveBeenCalled();
  });
  it('does nothing for multiple collections', () => {
    component.collections = [collection('x'), collection('y')];
    component.onFilterEnter();
    expect(shortcut.activateResource).not.toHaveBeenCalled();
  });
});
describe('CollectionDetailComponent Enter handler', () => {
  let component: CollectionDetailComponent;
  let shortcut: ReturnType<typeof shortcutSpy>;
  beforeEach(() => {
    shortcut = shortcutSpy();
    component = new CollectionDetailComponent(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      shortcut,
      { getUserData$: () => undefined } as never,
      {} as never
    );
  });
  it('activates the only visible bookmark when no notes are visible', () => {
    component.filteredBookmarks = [bookmark('a')];
    component.filteredNotes = [];
    component.onFilterEnter();
    expectActivated(shortcut, 'a', true, ['bookmark', 'note']);
  });
  it('activates the only visible note', () => {
    component.filteredBookmarks = [];
    component.filteredNotes = [note('n')];
    component.onFilterEnter();
    expectActivated(shortcut, 'n', true, ['bookmark', 'note']);
  });
  it('does nothing when a bookmark and a note are both visible', () => {
    component.filteredBookmarks = [bookmark('a')];
    component.filteredNotes = [note('n')];
    component.onFilterEnter();
    expect(shortcut.activateResource).not.toHaveBeenCalled();
  });
  it('does nothing for zero or multiple bookmarks', () => {
    component.filteredBookmarks = [];
    component.filteredNotes = [];
    component.onFilterEnter();
    component.filteredBookmarks = [bookmark('a'), bookmark('b')];
    component.onFilterEnter();
    expect(shortcut.activateResource).not.toHaveBeenCalled();
  });
});
describe('AsyncSearchResultListComponent Enter handler', () => {
  let component: AsyncSearchResultListComponent;
  let shortcut: ReturnType<typeof shortcutSpy>;
  let auth: { isLoggedIn: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    shortcut = shortcutSpy();
    auth = { isLoggedIn: vi.fn<AuthenticationService['isLoggedIn']>() };
    auth.isLoggedIn.mockReturnValue(true);
    const injector = {
      get: (token: unknown) => {
        if (token === AuthenticationService) return auth;
        if (token === MainLinkShortcutService) return shortcut;
        if (token === ActivatedRoute) return {};
        return {};
      },
    };
    component = new AsyncSearchResultListComponent(
      injector as never,
      {} as never,
      {} as never
    );
  });
  const setResults = (results: (Bookmark | Note)[], filter = '') => {
    (
      component as unknown as { searchResultsSnapshot: (Bookmark | Note)[] }
    ).searchResultsSnapshot = results;
    component.filterText = filter;
  };
  it('activates the only visible bookmark (bookmark is the only declared type)', () => {
    setResults([bookmark('a'), note('n')], 'Bookmark a');
    component.onFilterEnter();
    expectActivated(shortcut, 'a', true, ['bookmark']);
  });
  it('does nothing when the only match is a note, so the search page stays', () => {
    setResults([bookmark('a'), note('n')], 'Note n');
    component.onFilterEnter();
    expect(shortcut.activateResource).not.toHaveBeenCalled();
  });
  it('does nothing for zero or multiple results', () => {
    setResults([bookmark('a'), bookmark('b')], '');
    component.onFilterEnter();
    setResults([bookmark('a')], 'zzz');
    component.onFilterEnter();
    expect(shortcut.activateResource).not.toHaveBeenCalled();
  });
  it('only hints for a bookmark and stays silent for a lone note', () => {
    setResults([bookmark('a')], '');
    expect(component.filterActivationHint).toBe('bookmark');
    setResults([note('n')], '');
    expect(component.filterActivationHint).toBeNull();
  });
});
