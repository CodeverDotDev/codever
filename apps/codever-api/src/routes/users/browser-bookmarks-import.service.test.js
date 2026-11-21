jest.mock('../../model/bookmark', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));

const Bookmark = require('../../model/bookmark');
const {
  importBrowserBookmarks,
} = require('./browser-bookmarks-import.service');

const USER_ID = 'user-1';
const DISPLAY_NAME = 'Tester';

const header = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>`;

const folder = (name, ...content) => `<DT><H3>${name}</H3>
<DL><p>
${content.join('\n')}
</DL><p>`;

const link = (href, name, tags) =>
  `<DT><A HREF="${href}" ADD_DATE="1767225600"${
    tags !== undefined ? ` TAGS="${tags}"` : ''
  }>${name}</A>`;

const file = (...content) => `${header}
<DL><p>
${content.join('\n')}
</DL><p>
`;

/** A Codever browser export as written by the UI (with TAGS). */
const codeverExport = file(
  folder(
    'Codever export 2026-11-20',
    folder(
      'Collections',
      folder('Reading list', link('https://a.dev', 'A', 'java,spring'))
    ),
    folder(
      'Tags',
      folder('java', link('https://a.dev', 'A', 'java,spring')),
      folder('spring', link('https://a.dev', 'A', 'java,spring'))
    ),
    folder(
      'All',
      link('https://a.dev', 'A', 'java,spring'),
      link('https://b.dev', 'B', 'rare-tag')
    )
  )
);

/** The same export after a round trip through Chrome (TAGS dropped). */
const chromeReExport = file(
  folder(
    'Other bookmarks',
    folder(
      'Imported',
      folder(
        'Codever export 2026-11-20',
        folder(
          'Collections',
          folder('Reading list', link('https://c.dev', 'C'))
        ),
        folder(
          'Tags',
          folder('java', link('https://a.dev', 'A')),
          folder('spring', link('https://a.dev', 'A'))
        ),
        folder(
          'All',
          link('https://a.dev', 'A'),
          link('https://b.dev', 'B'),
          link('https://c.dev', 'C')
        )
      )
    )
  )
);

let createdDocs;

beforeEach(() => {
  jest.clearAllMocks();
  createdDocs = [];
  Bookmark.findOne.mockResolvedValue(null);
  Bookmark.create.mockImplementation(async (bookmark) => {
    const doc = { _id: `id-${createdDocs.length}`, ...bookmark };
    createdDocs.push(doc);
    return doc;
  });
});

const createdByLocation = () =>
  Object.fromEntries(createdDocs.map((doc) => [doc.location, doc]));

const existingBookmark = (fields) => ({
  ...fields,
  save: jest.fn().mockResolvedValue(undefined),
});

describe('generic browser import (unchanged behaviour)', () => {
  test('turns folder path into tags and skips browser root folders', async () => {
    const html = file(
      folder(
        'Bookmarks bar',
        folder('Dev Tools', folder('Java', link('https://j.dev', 'J')))
      )
    );

    const result = await importBrowserBookmarks(USER_ID, html, DISPLAY_NAME);

    expect(Bookmark.create).toHaveBeenCalledWith({
      name: 'J',
      location: 'https://j.dev',
      userId: USER_ID,
      userDisplayName: DISPLAY_NAME,
      public: false,
      tags: ['java', 'dev-tools', IMPORTED_TAG()],
      likeCount: 0,
    });
    expect(result.created).toHaveLength(1);
    expect(result.duplicatesSize).toBe(0);
    expect(result.inErrorSize).toBe(0);
  });

  test('merges folder tags into an existing private bookmark', async () => {
    const existing = existingBookmark({ tags: ['css'], public: false });
    Bookmark.findOne.mockResolvedValue(existing);

    const result = await importBrowserBookmarks(
      USER_ID,
      file(folder('Design', link('https://css.dev', 'CSS'))),
      DISPLAY_NAME
    );

    expect(Bookmark.findOne).toHaveBeenCalledWith({
      userId: USER_ID,
      location: 'https://css.dev',
    });
    expect(existing.tags).toEqual(['css', 'design', IMPORTED_TAG()]);
    expect(existing.save).toHaveBeenCalled();
    expect(Bookmark.create).not.toHaveBeenCalled();
    expect(result.duplicatesSize).toBe(1);
  });

  test('does not add imported-browser to an existing public bookmark', async () => {
    const existing = existingBookmark({ tags: ['css'], public: true });
    Bookmark.findOne.mockResolvedValue(existing);

    await importBrowserBookmarks(
      USER_ID,
      file(folder('Design', link('https://css.dev', 'CSS'))),
      DISPLAY_NAME
    );

    expect(existing.tags).toEqual(['css', 'design']);
  });

  test('counts failed bookmarks', async () => {
    Bookmark.create.mockRejectedValue(new Error('validation'));

    const result = await importBrowserBookmarks(
      USER_ID,
      file(link('https://x.dev', 'X')),
      DISPLAY_NAME
    );

    expect(result.inErrorSize).toBe(1);
    expect(result.created).toHaveLength(0);
  });

  test('a renamed export root falls back to generic import', async () => {
    const html = file(
      folder(
        'My old stuff',
        folder('Tags', folder('java', link('https://a.dev', 'A')))
      )
    );

    await importBrowserBookmarks(USER_ID, html, DISPLAY_NAME);

    expect(createdByLocation()['https://a.dev'].tags).toEqual([
      'java',
      'tags',
      'my-old-stuff',
      IMPORTED_TAG(),
    ]);
  });
});

describe('grouping by location', () => {
  test('one bookmark per URL in a file, with merged tags', async () => {
    const html = file(
      folder('Java', link('https://a.dev', 'A first')),
      folder('Spring', link('https://a.dev', 'A second'))
    );

    const result = await importBrowserBookmarks(USER_ID, html, DISPLAY_NAME);

    expect(Bookmark.findOne).toHaveBeenCalledTimes(1);
    expect(Bookmark.create).toHaveBeenCalledTimes(1);
    const created = createdByLocation()['https://a.dev'];
    expect(created.name).toBe('A first');
    expect(created.tags).toEqual(['java', IMPORTED_TAG(), 'spring']);
    expect(result.created).toHaveLength(1);
    expect(result.duplicatesSize).toBe(0);
  });

  test('saves a merge once per URL and waits for it', async () => {
    let saved = false;
    const existing = existingBookmark({ tags: ['old'], public: false });
    existing.save = jest.fn(
      () =>
        new Promise((resolve) =>
          setTimeout(() => {
            saved = true;
            resolve();
          })
        )
    );
    Bookmark.findOne.mockResolvedValue(existing);

    const result = await importBrowserBookmarks(
      USER_ID,
      file(
        folder('One', link('https://a.dev', 'A')),
        folder('Two', link('https://a.dev', 'A'))
      ),
      DISPLAY_NAME
    );

    expect(saved).toBe(true);
    expect(existing.save).toHaveBeenCalledTimes(1);
    expect(existing.tags).toEqual(['old', 'one', IMPORTED_TAG(), 'two']);
    expect(result.duplicatesSize).toBe(1);
  });
});

describe('Codever export round trip', () => {
  test('direct re-import uses the TAGS attribute', async () => {
    const result = await importBrowserBookmarks(
      USER_ID,
      codeverExport,
      DISPLAY_NAME
    );

    const byLocation = createdByLocation();
    expect(Object.keys(byLocation)).toEqual(['https://a.dev', 'https://b.dev']);
    expect(byLocation['https://a.dev'].tags).toEqual([
      'java',
      'spring',
      IMPORTED_TAG(),
    ]);
    expect(byLocation['https://b.dev'].tags).toEqual([
      'rare-tag',
      IMPORTED_TAG(),
    ]);
    expect(createdDocs.every((doc) => doc.public === false)).toBe(true);
    expect(result.created).toHaveLength(2);
    expect(result.duplicatesSize).toBe(0);
  });

  test('re-import via Chrome restores tags from Tags folders only', async () => {
    await importBrowserBookmarks(USER_ID, chromeReExport, DISPLAY_NAME);

    const byLocation = createdByLocation();
    expect(byLocation['https://a.dev'].tags).toEqual([
      'java',
      IMPORTED_TAG(),
      'spring',
    ]);
    expect(byLocation['https://b.dev'].tags).toEqual([IMPORTED_TAG()]);
  });

  test('collection folders never become tags', async () => {
    await importBrowserBookmarks(USER_ID, chromeReExport, DISPLAY_NAME);

    const allTags = createdDocs.flatMap((doc) => doc.tags);
    expect(createdByLocation()['https://c.dev'].tags).toEqual([
      IMPORTED_TAG(),
    ]);
    for (const structural of [
      'reading-list',
      'Reading list',
      'collections',
      'all',
      'tags',
      'imported',
      'other-bookmarks',
      'codever-export-2026-11-20',
    ]) {
      expect(allTags).not.toContain(structural);
    }
  });

  test('a lowercase root name is recognised', async () => {
    const html = file(
      folder(
        'codever EXPORT old',
        folder('Tags', folder('java', folder('sub', link('https://a.dev', 'A'))))
      )
    );

    await importBrowserBookmarks(USER_ID, html, DISPLAY_NAME);

    expect(createdByLocation()['https://a.dev'].tags).toEqual([
      'java',
      IMPORTED_TAG(),
    ]);
  });

  test('empty TAGS attribute falls back to the tag folder', async () => {
    const html = file(
      folder(
        'Codever export 2026-11-20',
        folder('Tags', folder('java', link('https://a.dev', 'A', ' , ')))
      )
    );

    await importBrowserBookmarks(USER_ID, html, DISPLAY_NAME);

    expect(createdByLocation()['https://a.dev'].tags).toEqual([
      'java',
      IMPORTED_TAG(),
    ]);
  });
});

function IMPORTED_TAG() {
  return 'imported-browser';
}
