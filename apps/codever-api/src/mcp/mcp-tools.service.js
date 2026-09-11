const personalBookmarksSearchService = require('../common/searching/bookmarks-search.service');
const notesSearchService = require('../routes/users/notes/notes-search.service');
const personalBookmarksService = require('../routes/users/bookmarks/personal-bookmarks.service');
const personalNotesService = require('../routes/users/notes/personal-notes.service');

/**
 * Read-only tool layer backing the Codever MCP server.
 *
 * Every function is scoped to a single authenticated `userId` (derived from
 * the token, never from tool arguments) and only ever READS data — there are
 * deliberately no create/update/delete operations here so that the MCP surface
 * cannot mutate a user's bookmarks or notes (see documentation/mcp/mcp-auth.md,
 * "Layer 1 — Read-only by construction").
 */

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const EXCERPT_LENGTH = 300;
const SUPPORTED_TYPES = ['bookmark', 'note'];

function clampLimit(limit) {
  const n = parseInt(limit, 10);
  if (Number.isNaN(n) || n < 1) {
    return DEFAULT_LIMIT;
  }
  return Math.min(n, MAX_LIMIT);
}

function normalizePage(page) {
  const n = parseInt(page, 10);
  return Number.isNaN(n) || n < 1 ? 1 : n;
}

function toExcerpt(text) {
  if (!text) {
    return '';
  }
  const trimmed = String(text).trim();
  return trimmed.length > EXCERPT_LENGTH
    ? `${trimmed.substring(0, EXCERPT_LENGTH)}…`
    : trimmed;
}

function idToString(id) {
  if (id === undefined || id === null) {
    return undefined;
  }
  return typeof id.toString === 'function' ? id.toString() : String(id);
}

/**
 * Build a Codever search query string from structured arguments.
 * Tags are encoded with the `[tag]` convention understood by search.utils.
 */
function buildQueryString(text, tags) {
  const parts = [];
  if (text && String(text).trim()) {
    parts.push(String(text).trim());
  }
  (tags || []).forEach((tag) => {
    const clean = String(tag).trim();
    if (clean) {
      parts.push(`[${clean}]`);
    }
  });
  return parts.join(' ');
}

function normalizeBookmark(bookmark) {
  return {
    type: 'bookmark',
    id: idToString(bookmark._id),
    title: bookmark.name,
    url: bookmark.location,
    tags: bookmark.tags || [],
    excerpt: toExcerpt(bookmark.description),
    public: !!bookmark.public,
    createdAt: bookmark.createdAt,
    updatedAt: bookmark.updatedAt,
  };
}

function normalizeNote(note) {
  return {
    type: 'note',
    id: idToString(note._id),
    title: note.title,
    tags: note.tags || [],
    excerpt: toExcerpt(note.content),
    contentType: note.contentType,
    reference: note.reference,
    public: !!note.public,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

function resolveTypes(types) {
  if (!Array.isArray(types) || types.length === 0) {
    return [...SUPPORTED_TYPES];
  }
  const filtered = types.filter((t) => SUPPORTED_TYPES.includes(t));
  return filtered.length > 0 ? filtered : [...SUPPORTED_TYPES];
}

/**
 * search_entries — search a user's own bookmarks and/or notes.
 *
 * @param {string} userId
 * @param {object} args
 * @param {string} [args.text]   Free-text terms
 * @param {string[]} [args.tags] Tags (ALL must match)
 * @param {string[]} [args.types] Subset of ['bookmark','note']
 * @param {number} [args.page]
 * @param {number} [args.limit]
 * @param {'any'|'all'} [args.searchInclude] Match ANY term (OR) or ALL terms (AND, default)
 * @returns {Promise<{page:number, limit:number, count:number, results:object[]}>}
 */
async function searchEntries(userId, args = {}) {
  const { text = '', tags = [], types, page, limit, searchInclude } = args;
  const query = buildQueryString(text, tags);
  const resolvedPage = normalizePage(page);
  const resolvedLimit = clampLimit(limit);
  const resolvedTypes = resolveTypes(types);
  // Default preserves the historic AND behavior; callers may opt into OR (recall).
  const include = searchInclude === 'any' ? 'any' : false;

  const results = [];

  if (resolvedTypes.includes('bookmark')) {
    const bookmarks = await personalBookmarksSearchService.findPersonalBookmarks(
      userId,
      query,
      resolvedPage,
      resolvedLimit,
      include
    );
    results.push(...bookmarks.map(normalizeBookmark));
  }

  if (resolvedTypes.includes('note')) {
    const notes = await notesSearchService.findPersonalNotes(
      userId,
      query,
      resolvedPage,
      resolvedLimit,
      include
    );
    results.push(...notes.map(normalizeNote));
  }

  return {
    page: resolvedPage,
    limit: resolvedLimit,
    count: results.length,
    results,
  };
}

/**
 * get_entry — fetch a single authorized entry (full content).
 *
 * @param {string} userId
 * @param {object} args
 * @param {string} args.id
 * @param {'bookmark'|'note'} args.type
 */
async function getEntry(userId, args = {}) {
  const { id, type } = args;

  if (!id || !type) {
    throw new Error('get_entry requires both "id" and "type"');
  }

  if (type === 'bookmark') {
    const bookmark = await personalBookmarksService.getBookmarkById(userId, id);
    return {
      ...normalizeBookmark(bookmark.toObject ? bookmark.toObject() : bookmark),
      description: bookmark.description,
    };
  }

  if (type === 'note') {
    const note = await personalNotesService.getNoteById(userId, id);
    const plain = note.toObject ? note.toObject() : note;
    return {
      ...normalizeNote(plain),
      content: plain.content,
    };
  }

  throw new Error(`Unsupported entry type: ${type}`);
}

/**
 * list_tags — list the user's tags (with counts) to help the agent
 * discover vocabulary before searching.
 *
 * @param {string} userId
 * @param {object} args
 * @param {'bookmark'|'note'} [args.type] Restrict to one resource type
 */
async function listTags(userId, args = {}) {
  const { type } = args;

  const wantsBookmarks = !type || type === 'bookmark';
  const wantsNotes = !type || type === 'note';

  const counts = new Map();

  const addTags = (tags) => {
    tags.forEach(({ name, count }) => {
      counts.set(name, (counts.get(name) || 0) + count);
    });
  };

  if (wantsBookmarks) {
    addTags(await personalBookmarksService.getUserTagsAggregated(userId));
  }
  if (wantsNotes) {
    addTags(await personalNotesService.getUserNoteTags(userId));
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

module.exports = {
  searchEntries,
  getEntry,
  listTags,
  // exported for unit testing
  buildQueryString,
  clampLimit,
  normalizePage,
  toExcerpt,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  EXCERPT_LENGTH,
};

