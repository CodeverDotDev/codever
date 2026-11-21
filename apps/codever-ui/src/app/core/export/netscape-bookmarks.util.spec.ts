import { describe, expect, it } from 'vitest';
import { Bookmark } from '../model/bookmark';
import { Collection } from '../model/collection';
import {
  DEFAULT_TAG_FOLDER_LIMIT,
  escapeHtml,
  selectTopTags,
  toNetscapeBookmarksHtml,
} from './netscape-bookmarks.util';

const EXPORT_DATE = new Date(2026, 10, 20, 10, 30);

function bookmark(
  id: string,
  tags: string[],
  overrides: Partial<Bookmark> = {}
): Bookmark {
  return {
    _id: id,
    name: `Bookmark ${id}`,
    location: `https://example.com/${id}`,
    type: 'bookmark',
    tags,
    createdAt: new Date(Date.UTC(2026, 0, Number(id) || 1)),
    updatedAt: new Date(Date.UTC(2026, 1, Number(id) || 1)),
    ...overrides,
  };
}

function collection(name: string, items: Collection['items']): Collection {
  return { name, items, userId: 'u1', public: false };
}

const item = (id: string, resourceType: 'bookmark' | 'note' = 'bookmark') => ({
  resourceId: id,
  resourceType,
});

/** Maps each link (by HREF) to the folder paths it appears in. */
function linkPaths(html: string): Map<string, string[]> {
  const result = new Map<string, string[]>();
  const stack: string[] = [];
  let pendingFolder: string | null = null;
  for (const line of html.split('\n').map((l) => l.trim())) {
    const folder = /^<DT><H3[^>]*>(.*)<\/H3>$/.exec(line);
    const link = /^<DT><A HREF="([^"]*)"/.exec(line);
    if (folder) {
      pendingFolder = folder[1];
    } else if (line === '<DL><p>') {
      if (pendingFolder !== null) {
        stack.push(pendingFolder);
        pendingFolder = null;
      }
    } else if (line === '</DL><p>') {
      stack.pop();
    } else if (link) {
      const paths = result.get(link[1]) || [];
      paths.push(stack.join('/'));
      result.set(link[1], paths);
    }
  }
  return result;
}

/** Folder paths in document order. */
function folderPaths(html: string): string[] {
  const paths: string[] = [];
  const stack: string[] = [];
  let pendingFolder: string | null = null;
  for (const line of html.split('\n').map((l) => l.trim())) {
    const folder = /^<DT><H3[^>]*>(.*)<\/H3>$/.exec(line);
    if (folder) {
      pendingFolder = folder[1];
    } else if (line === '<DL><p>' && pendingFolder !== null) {
      stack.push(pendingFolder);
      paths.push(stack.join('/'));
      pendingFolder = null;
    } else if (line === '</DL><p>') {
      stack.pop();
    }
  }
  return paths;
}

const ROOT = 'Codever export 2026-11-20';

describe('toNetscapeBookmarksHtml', () => {
  describe('structure', () => {
    it('writes the Netscape header and a dated root folder', () => {
      const { html } = toNetscapeBookmarksHtml(
        [bookmark('1', ['java'])],
        [],
        { tagFolderLimit: DEFAULT_TAG_FOLDER_LIMIT },
        EXPORT_DATE
      );

      expect(html.startsWith('<!DOCTYPE NETSCAPE-Bookmark-file-1>')).toBe(
        true
      );
      expect(html).toContain('charset=UTF-8');
      expect(folderPaths(html)[0]).toBe(ROOT);
    });

    it('orders Collections, Tags and All inside the root', () => {
      const { html } = toNetscapeBookmarksHtml(
        [bookmark('1', ['java'])],
        [collection('Reading', [item('1')])],
        { tagFolderLimit: 50 },
        EXPORT_DATE
      );

      const topLevel = folderPaths(html).filter(
        (p) => p.split('/').length === 2
      );
      expect(topLevel).toEqual([
        `${ROOT}/Collections`,
        `${ROOT}/Tags`,
        `${ROOT}/All`,
      ]);
    });

    it('omits empty Collections and Tags folders but keeps All', () => {
      const { html } = toNetscapeBookmarksHtml(
        [bookmark('1', [])],
        [collection('Only notes', [item('n1', 'note')])],
        { tagFolderLimit: 50 },
        EXPORT_DATE
      );

      expect(folderPaths(html)).toEqual([ROOT, `${ROOT}/All`]);
    });

    it('puts every bookmark exactly once in All, newest first', () => {
      const bookmarks = [
        bookmark('1', ['a', 'b', 'c', 'd']),
        bookmark('3', ['a']),
        bookmark('2', ['b']),
      ];
      const { html, exportedCount } = toNetscapeBookmarksHtml(
        bookmarks,
        [collection('X', [item('1')]), collection('Y', [item('1')])],
        { tagFolderLimit: 50 },
        EXPORT_DATE
      );

      const paths = linkPaths(html);
      const inAll = [...paths.entries()]
        .filter(([, p]) => p.includes(`${ROOT}/All`))
        .map(([href]) => href);
      expect(inAll).toHaveLength(3);
      expect(
        paths.get('https://example.com/1').filter((p) => p === `${ROOT}/All`)
      ).toHaveLength(1);
      expect(exportedCount).toBe(3);

      const allSection = html.slice(html.indexOf('>All</H3>'));
      const order = [...allSection.matchAll(/HREF="([^"]*)"/g)].map(
        (m) => m[1]
      );
      expect(order).toEqual([
        'https://example.com/3',
        'https://example.com/2',
        'https://example.com/1',
      ]);
    });

    it('includes private and public bookmarks without visibility folders', () => {
      const bookmarks = [
        bookmark('1', ['x'], { public: false }),
        bookmark('2', ['x'], { public: true }),
      ];
      const { html } = toNetscapeBookmarksHtml(
        bookmarks,
        [],
        { tagFolderLimit: 50 },
        EXPORT_DATE
      );

      expect(linkPaths(html).size).toBe(2);
      expect(folderPaths(html).some((p) => /Personal|Public/.test(p))).toBe(
        false
      );
    });
  });

  describe('links', () => {
    it('writes HREF, ADD_DATE, LAST_MODIFIED and all TAGS', () => {
      const created = new Date(Date.UTC(2026, 0, 2, 3, 4, 5));
      const updated = new Date(Date.UTC(2026, 5, 6, 7, 8, 9));
      const { html } = toNetscapeBookmarksHtml(
        [
          bookmark('1', ['java', 'spring', 'java'], {
            createdAt: created,
            updatedAt: updated,
          }),
        ],
        [],
        { tagFolderLimit: 50 },
        EXPORT_DATE
      );

      expect(html).toContain(
        `<DT><A HREF="https://example.com/1" ADD_DATE="${
          created.getTime() / 1000
        }" LAST_MODIFIED="${
          updated.getTime() / 1000
        }" TAGS="java,spring">Bookmark 1</A>`
      );
    });

    it('keeps tags outside the cap in the TAGS attribute', () => {
      const bookmarks = [
        bookmark('1', ['common', 'rare-tag']),
        bookmark('2', ['common']),
      ];
      const { html } = toNetscapeBookmarksHtml(
        bookmarks,
        [],
        { tagFolderLimit: 1 },
        EXPORT_DATE
      );

      expect(html).toContain('TAGS="common,rare-tag"');
      expect(folderPaths(html)).not.toContain(`${ROOT}/Tags/rare-tag`);
    });

    it('does not export descriptions', () => {
      const { html } = toNetscapeBookmarksHtml(
        [bookmark('1', [], { description: 'secret description text' })],
        [],
        { tagFolderLimit: 50 },
        EXPORT_DATE
      );

      expect(html).not.toContain('secret description text');
      expect(html).not.toContain('<DD>');
    });
  });

  describe('collections', () => {
    it('creates sorted folders with bookmarks only, skipping notes', () => {
      const { html } = toNetscapeBookmarksHtml(
        [bookmark('1', []), bookmark('2', [])],
        [
          collection('Zeta', [item('2')]),
          collection('Reading list', [item('1'), item('2'), item('n', 'note')]),
          collection('Notes only', [item('n', 'note')]),
        ],
        { tagFolderLimit: 50 },
        EXPORT_DATE
      );

      expect(
        folderPaths(html).filter((p) => p.startsWith(`${ROOT}/Collections/`))
      ).toEqual([`${ROOT}/Collections/Reading list`, `${ROOT}/Collections/Zeta`]);
      expect(linkPaths(html).get('https://example.com/2')).toEqual([
        `${ROOT}/Collections/Reading list`,
        `${ROOT}/Collections/Zeta`,
        `${ROOT}/All`,
      ]);
      expect(linkPaths(html).size).toBe(2);
    });

    it('ignores items that reference unknown or repeated bookmarks', () => {
      const { html } = toNetscapeBookmarksHtml(
        [bookmark('1', [])],
        [collection('A', [item('1'), item('1'), item('missing')])],
        { tagFolderLimit: 50 },
        EXPORT_DATE
      );

      expect(linkPaths(html).get('https://example.com/1')).toEqual([
        `${ROOT}/Collections/A`,
        `${ROOT}/All`,
      ]);
    });
  });

  describe('tag folders', () => {
    const manyTagBookmarks = (distinctTags: number): Bookmark[] =>
      Array.from({ length: distinctTags }, (_, i) =>
        bookmark(String(i + 1), [`tag-${String(i).padStart(3, '0')}`])
      );

    it('creates folders for the top 50 tags by default', () => {
      const { html } = toNetscapeBookmarksHtml(
        manyTagBookmarks(120),
        [],
        { tagFolderLimit: DEFAULT_TAG_FOLDER_LIMIT },
        EXPORT_DATE
      );

      expect(
        folderPaths(html).filter((p) => p.startsWith(`${ROOT}/Tags/`))
      ).toHaveLength(50);
    });

    it('creates folders for all tags when unlimited', () => {
      const { html } = toNetscapeBookmarksHtml(
        manyTagBookmarks(120),
        [],
        { tagFolderLimit: null },
        EXPORT_DATE
      );

      expect(
        folderPaths(html).filter((p) => p.startsWith(`${ROOT}/Tags/`))
      ).toHaveLength(120);
    });

    it('repeats a bookmark in each selected tag folder', () => {
      const { html } = toNetscapeBookmarksHtml(
        [bookmark('1', ['java', 'spring'])],
        [],
        { tagFolderLimit: 50 },
        EXPORT_DATE
      );

      expect(linkPaths(html).get('https://example.com/1')).toEqual([
        `${ROOT}/Tags/java`,
        `${ROOT}/Tags/spring`,
        `${ROOT}/All`,
      ]);
    });

    it('keeps a bookmark with only rare tags in All', () => {
      const { html } = toNetscapeBookmarksHtml(
        [bookmark('1', ['common']), bookmark('2', ['common']), bookmark('3', ['rare'])],
        [],
        { tagFolderLimit: 1 },
        EXPORT_DATE
      );

      expect(linkPaths(html).get('https://example.com/3')).toEqual([
        `${ROOT}/All`,
      ]);
    });
  });

  describe('safety', () => {
    it('escapes names, urls, tags and collection names', () => {
      const evil = bookmark('1', ['a"b<c>'], {
        name: '<b>Tips & "tricks"</b>',
        location: 'https://example.com/?a=1&b="2"',
      });
      const { html } = toNetscapeBookmarksHtml(
        [evil],
        [collection('<i>col</i>', [item('1')])],
        { tagFolderLimit: 50 },
        EXPORT_DATE
      );

      expect(html).toContain(
        '>&lt;b&gt;Tips &amp; &quot;tricks&quot;&lt;/b&gt;</A>'
      );
      expect(html).toContain('HREF="https://example.com/?a=1&amp;b=&quot;2&quot;"');
      expect(html).toContain('TAGS="a&quot;b&lt;c&gt;"');
      expect(html).toContain('>&lt;i&gt;col&lt;/i&gt;</H3>');
      expect(html).not.toContain('<b>');
      expect(html).not.toContain('<i>');

      const doc = new DOMParser().parseFromString(html, 'text/html');
      const anchor = doc.querySelector('a');
      expect(anchor.textContent).toBe('<b>Tips & "tricks"</b>');
      expect(anchor.getAttribute('href')).toBe(
        'https://example.com/?a=1&b="2"'
      );
      expect(doc.querySelectorAll('b, i')).toHaveLength(0);
    });

    it('skips javascript: and data: locations and reports them', () => {
      const { html, skippedCount, exportedCount } = toNetscapeBookmarksHtml(
        [
          bookmark('1', ['x'], { location: 'javascript:alert(1)' }),
          bookmark('2', ['x'], { location: '  DATA:text/html,hi' }),
          bookmark('3', ['x'], { location: 'ftp://files.example.com' }),
        ],
        [],
        { tagFolderLimit: 50 },
        EXPORT_DATE
      );

      expect(skippedCount).toBe(2);
      expect(exportedCount).toBe(1);
      expect(html.toLowerCase()).not.toContain('javascript:');
      expect(html.toLowerCase()).not.toContain('data:');
      expect(html).toContain('HREF="ftp://files.example.com"');
    });
  });
});

describe('selectTopTags', () => {
  it('breaks ties at the cut-off by name and sorts the result by name', () => {
    const bookmarks: Bookmark[] = [
      bookmark('1', ['zeta', 'beta', 'alpha']),
      bookmark('2', ['zeta', 'gamma']),
    ];

    expect(selectTopTags(bookmarks, 2)).toEqual(['alpha', 'zeta']);
    expect(selectTopTags(bookmarks, null)).toEqual([
      'alpha',
      'beta',
      'gamma',
      'zeta',
    ]);
    expect(selectTopTags(bookmarks, 0)).toEqual([]);
  });
});

describe('escapeHtml', () => {
  it('escapes the characters that can change HTML structure', () => {
    expect(escapeHtml(`<a href="x">&</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;'
    );
  });
});
