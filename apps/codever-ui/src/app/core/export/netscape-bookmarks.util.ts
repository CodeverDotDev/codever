import { Bookmark } from '../model/bookmark';
import { Collection } from '../model/collection';

/** Default number of tag folders created in a browser HTML export. */
export const DEFAULT_TAG_FOLDER_LIMIT = 50;

/** Prefix of the root folder; the importer recognises exports by it. */
export const CODEVER_EXPORT_ROOT_PREFIX = 'Codever export';

export interface NetscapeExportOptions {
  /** Maximum number of tag folders; `null` creates a folder for every tag. */
  tagFolderLimit: number | null;
}

export interface NetscapeExportResult {
  html: string;
  /** Number of bookmarks written to the file (each counted once). */
  exportedCount: number;
  /** Number of bookmarks left out because of an unsafe URL scheme. */
  skippedCount: number;
}

interface Folder {
  name: string;
  bookmarks?: Bookmark[];
  subfolders?: Folder[];
}

const UNSAFE_SCHEME = /^(javascript|data):/i;

/**
 * Builds a Netscape bookmark file (the HTML format browsers import and
 * export) with a dated root folder holding `Collections`, `Tags` (top N
 * tags) and `All` folders.
 */
export function toNetscapeBookmarksHtml(
  bookmarks: Bookmark[],
  collections: Collection[],
  options: NetscapeExportOptions,
  exportDate: Date
): NetscapeExportResult {
  const exported = bookmarks.filter((b) => !isUnsafeLocation(b.location));
  const skippedCount = bookmarks.length - exported.length;
  const all = sortNewestFirst(exported);

  const subfolders: Folder[] = [];
  const collectionFolders = buildCollectionFolders(all, collections);
  if (collectionFolders.length > 0) {
    subfolders.push({ name: 'Collections', subfolders: collectionFolders });
  }
  const tagFolders = buildTagFolders(all, options.tagFolderLimit);
  if (tagFolders.length > 0) {
    subfolders.push({ name: 'Tags', subfolders: tagFolders });
  }
  subfolders.push({ name: 'All', bookmarks: all });

  const root: Folder = {
    name: `${CODEVER_EXPORT_ROOT_PREFIX} ${formatDay(exportDate)}`,
    subfolders,
  };
  const exportSeconds = toEpochSeconds(exportDate);

  const lines = [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<!-- This is an automatically generated file. Exported from Codever. -->',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    '<TITLE>Bookmarks</TITLE>',
    '<H1>Bookmarks</H1>',
    '<DL><p>',
    ...renderFolder(root, 1, exportSeconds),
    '</DL><p>',
  ];

  return {
    html: lines.join('\n') + '\n',
    exportedCount: all.length,
    skippedCount,
  };
}

/**
 * Selects the tags used by the most bookmarks (ties broken by name), and
 * returns them sorted by name. `null` selects every tag.
 */
export function selectTopTags(
  bookmarks: Bookmark[],
  limit: number | null
): string[] {
  const counts = new Map<string, number>();
  for (const bookmark of bookmarks) {
    for (const tag of uniqueTags(bookmark)) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  const byUsage = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || compareNames(a[0], b[0]))
    .map(([tag]) => tag);
  const selected =
    limit === null ? byUsage : byUsage.slice(0, Math.max(0, limit));

  return selected.sort(compareNames);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildCollectionFolders(
  bookmarks: Bookmark[],
  collections: Collection[]
): Folder[] {
  const byId = new Map(bookmarks.map((b) => [b._id, b]));

  return [...collections]
    .sort((a, b) => compareNames(a.name, b.name))
    .map((collection) => {
      const seen = new Set<string>();
      const folderBookmarks: Bookmark[] = [];
      for (const item of collection.items || []) {
        const bookmark =
          item.resourceType === 'bookmark' ? byId.get(item.resourceId) : null;
        if (bookmark && !seen.has(item.resourceId)) {
          seen.add(item.resourceId);
          folderBookmarks.push(bookmark);
        }
      }
      return { name: collection.name, bookmarks: folderBookmarks };
    })
    .filter((folder) => folder.bookmarks.length > 0);
}

function buildTagFolders(
  bookmarks: Bookmark[],
  limit: number | null
): Folder[] {
  return selectTopTags(bookmarks, limit).map((tag) => ({
    name: tag,
    bookmarks: bookmarks.filter((b) => uniqueTags(b).includes(tag)),
  }));
}

function renderFolder(
  folder: Folder,
  depth: number,
  exportSeconds: number
): string[] {
  const indent = '    '.repeat(depth);
  const lines = [
    `${indent}<DT><H3 ADD_DATE="${exportSeconds}" LAST_MODIFIED="${exportSeconds}">` +
      `${escapeHtml(folder.name)}</H3>`,
    `${indent}<DL><p>`,
  ];
  for (const subfolder of folder.subfolders || []) {
    lines.push(...renderFolder(subfolder, depth + 1, exportSeconds));
  }
  for (const bookmark of folder.bookmarks || []) {
    lines.push(`${indent}    ${renderLink(bookmark)}`);
  }
  lines.push(`${indent}</DL><p>`);

  return lines;
}

function renderLink(bookmark: Bookmark): string {
  const attributes = [`HREF="${escapeHtml(bookmark.location || '')}"`];
  const added = toEpochSeconds(bookmark.createdAt);
  if (added !== null) {
    attributes.push(`ADD_DATE="${added}"`);
  }
  const modified = toEpochSeconds(bookmark.updatedAt);
  if (modified !== null) {
    attributes.push(`LAST_MODIFIED="${modified}"`);
  }
  const tags = uniqueTags(bookmark);
  if (tags.length > 0) {
    attributes.push(`TAGS="${escapeHtml(tags.join(','))}"`);
  }

  return `<DT><A ${attributes.join(' ')}>${escapeHtml(
    bookmark.name || bookmark.location || ''
  )}</A>`;
}

function isUnsafeLocation(location: string): boolean {
  return UNSAFE_SCHEME.test((location || '').trim());
}

function uniqueTags(bookmark: Bookmark): string[] {
  return [...new Set((bookmark.tags || []).filter((tag) => !!tag))];
}

function sortNewestFirst(bookmarks: Bookmark[]): Bookmark[] {
  // Bookmarks without a creation date go last; the sort is stable.
  const time = (b: Bookmark) => toEpochSeconds(b.createdAt) ?? -1;

  return [...bookmarks].sort((a, b) => time(b) - time(a));
}

function compareNames(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function toEpochSeconds(date: Date | string | undefined): number | null {
  if (!date) {
    return null;
  }
  const time = new Date(date).getTime();

  return isNaN(time) ? null : Math.floor(time / 1000);
}

function formatDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}
