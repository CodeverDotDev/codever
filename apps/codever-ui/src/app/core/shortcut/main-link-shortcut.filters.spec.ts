import { Bookmark } from '../model/bookmark';
import { Note } from '../model/note';
import { UserDataResource } from '../model/user-data-resource.type';
import { MainLinkShortcutService } from './main-link-shortcut.service';
import { QuickAccessResourcesComponent } from '../../left-navigation-menu/quick-access-resources.component';
import { HotKeysDialogComponent } from '../../shared/dialog/history-dialog/hot-keys-dialog.component';
import { MyCollectionsPageComponent } from '../../my-collections/my-collections-page.component';
import { CollectionDetailComponent } from '../../my-collections/collection-detail/collection-detail.component';
import { Collection } from '../model/collection';
import { AsyncSearchResultListComponent } from '../../shared/async-search-result-list/async-search-result-list.component';
import { AuthenticationService } from '../auth/authentication.service';
import { ActivatedRoute } from '@angular/router';
/**
 * Focused tests for the per-filter `Enter` handlers that open the only visible
 * bookmark (or, for My Collections, navigate to the only visible collection).
 * Each component is constructed directly with mocks so no template or DI setup
 * is required - the handlers under test are pure logic over local state.
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
function shortcutSpy(): jasmine.SpyObj<MainLinkShortcutService> {
  return jasmine.createSpyObj<MainLinkShortcutService>(
    'MainLinkShortcutService',
    ['openBookmarkInNewTab', 'register', 'unregister']
  );
}
/** Assert the shortcut opened exactly the expected bookmark, logged in. */
function expectOpenedBookmark(
  shortcut: jasmine.SpyObj<MainLinkShortcutService>,
  id: string
): void {
  expect(shortcut.openBookmarkInNewTab.calls.count()).toBe(1);
  const args = shortcut.openBookmarkInNewTab.calls.mostRecent().args;
  expect((args[0] as Bookmark)._id).toBe(id);
  expect(args[1]).toBeTrue();
}
describe('QuickAccessResourcesComponent Enter handler', () => {
  let component: QuickAccessResourcesComponent;
  let shortcut: jasmine.SpyObj<MainLinkShortcutService>;
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
  it('opens the only visible bookmark', () => {
    setResources([bookmark('a'), bookmark('b')], 'Bookmark a');
    component.onFilterEnter();
    expectOpenedBookmark(shortcut, 'a');
  });
  it('does nothing when multiple bookmarks are visible', () => {
    setResources([bookmark('a'), bookmark('b')], '');
    component.onFilterEnter();
    expect(shortcut.openBookmarkInNewTab.calls.count()).toBe(0);
  });
  it('does nothing when no bookmark matches', () => {
    setResources([bookmark('a')], 'zzz');
    component.onFilterEnter();
    expect(shortcut.openBookmarkInNewTab.calls.count()).toBe(0);
  });
  it('does nothing when the only match is a note', () => {
    setResources([note('n'), bookmark('a')], 'Note n');
    component.onFilterEnter();
    expect(shortcut.openBookmarkInNewTab.calls.count()).toBe(0);
  });
});
describe('HotKeysDialogComponent Enter handler', () => {
  let component: HotKeysDialogComponent;
  let shortcut: jasmine.SpyObj<MainLinkShortcutService>;
  beforeEach(() => {
    shortcut = shortcutSpy();
    component = new HotKeysDialogComponent({} as never, {} as never, shortcut, {
      resources$: { subscribe: () => ({ unsubscribe: () => undefined }) },
      title: 'Pinned',
    } as never);
  });
  const setResources = (resources: UserDataResource[], filter = '') => {
    (component as unknown as { resources: UserDataResource[] }).resources =
      resources;
    component.filterText = filter as '';
  };
  it('opens the only visible bookmark (always logged in)', () => {
    setResources([bookmark('a'), note('n')], 'Bookmark a');
    component.onFilterEnter();
    expectOpenedBookmark(shortcut, 'a');
  });
  it('does nothing when the only visible resource is a note', () => {
    setResources([note('n'), bookmark('a')], 'Note n');
    component.onFilterEnter();
    expect(shortcut.openBookmarkInNewTab.calls.count()).toBe(0);
  });
  it('does nothing for zero or multiple results', () => {
    setResources([bookmark('a'), bookmark('b')], '');
    component.onFilterEnter();
    setResources([bookmark('a')], 'zzz');
    component.onFilterEnter();
    expect(shortcut.openBookmarkInNewTab.calls.count()).toBe(0);
  });
});
describe('MyCollectionsPageComponent Enter handler', () => {
  let component: MyCollectionsPageComponent;
  let router: jasmine.SpyObj<{ navigate: (c: unknown[]) => void }>;
  const collection = (id: string): Collection =>
    ({ _id: id, name: `Collection ${id}` } as Collection);
  beforeEach(() => {
    router = jasmine.createSpyObj('Router', ['navigate']);
    component = new MyCollectionsPageComponent(
      {} as never,
      {} as never,
      {} as never,
      router as never,
      { getUserData$: () => undefined } as never,
      {} as never
    );
  });
  it('opens the only visible collection in the current tab', () => {
    component.collections = [collection('x')];
    component.onFilterEnter();
    expect(router.navigate.calls.count()).toBe(1);
    expect(router.navigate.calls.mostRecent().args[0]).toEqual([
      '/my-collections',
      'x',
    ]);
  });
  it('does nothing for zero collections', () => {
    component.collections = [];
    component.onFilterEnter();
    expect(router.navigate.calls.count()).toBe(0);
  });
  it('does nothing for multiple collections', () => {
    component.collections = [collection('x'), collection('y')];
    component.onFilterEnter();
    expect(router.navigate.calls.count()).toBe(0);
  });
});
describe('CollectionDetailComponent Enter handler', () => {
  let component: CollectionDetailComponent;
  let shortcut: jasmine.SpyObj<MainLinkShortcutService>;
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
  it('opens the only visible bookmark when no notes are visible', () => {
    component.filteredBookmarks = [bookmark('a')];
    component.filteredNotes = [];
    component.onFilterEnter();
    expectOpenedBookmark(shortcut, 'a');
  });
  it('does nothing when a note is also visible', () => {
    component.filteredBookmarks = [bookmark('a')];
    component.filteredNotes = [note('n')];
    component.onFilterEnter();
    expect(shortcut.openBookmarkInNewTab.calls.count()).toBe(0);
  });
  it('does nothing for zero or multiple bookmarks', () => {
    component.filteredBookmarks = [];
    component.filteredNotes = [];
    component.onFilterEnter();
    component.filteredBookmarks = [bookmark('a'), bookmark('b')];
    component.onFilterEnter();
    expect(shortcut.openBookmarkInNewTab.calls.count()).toBe(0);
  });
});
describe('AsyncSearchResultListComponent Enter handler', () => {
  let component: AsyncSearchResultListComponent;
  let shortcut: jasmine.SpyObj<MainLinkShortcutService>;
  let auth: jasmine.SpyObj<AuthenticationService>;
  beforeEach(() => {
    shortcut = shortcutSpy();
    auth = jasmine.createSpyObj<AuthenticationService>(
      'AuthenticationService',
      ['isLoggedIn']
    );
    auth.isLoggedIn.and.returnValue(true);
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
  it('opens the only visible bookmark', () => {
    setResults([bookmark('a'), note('n')], 'Bookmark a');
    component.onFilterEnter();
    expectOpenedBookmark(shortcut, 'a');
  });
  it('does nothing when the only match is a note', () => {
    setResults([bookmark('a'), note('n')], 'Note n');
    component.onFilterEnter();
    expect(shortcut.openBookmarkInNewTab.calls.count()).toBe(0);
  });
  it('does nothing for zero or multiple results', () => {
    setResults([bookmark('a'), bookmark('b')], '');
    component.onFilterEnter();
    setResults([bookmark('a')], 'zzz');
    component.onFilterEnter();
    expect(shortcut.openBookmarkInNewTab.calls.count()).toBe(0);
  });
});
