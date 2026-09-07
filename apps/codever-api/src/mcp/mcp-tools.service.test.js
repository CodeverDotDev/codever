jest.mock('../common/searching/bookmarks-search.service', () => ({
  findPersonalBookmarks: jest.fn(),
}));
jest.mock('../routes/users/notes/notes-search.service', () => ({
  findPersonalNotes: jest.fn(),
}));
jest.mock('../routes/users/bookmarks/personal-bookmarks.service', () => ({
  getBookmarkById: jest.fn(),
  getUserTagsAggregated: jest.fn(),
}));
jest.mock('../routes/users/notes/personal-notes.service', () => ({
  getNoteById: jest.fn(),
  getUserNoteTags: jest.fn(),
}));

const bookmarksSearchService = require('../common/searching/bookmarks-search.service');
const notesSearchService = require('../routes/users/notes/notes-search.service');
const personalBookmarksService = require('../routes/users/bookmarks/personal-bookmarks.service');
const personalNotesService = require('../routes/users/notes/personal-notes.service');

const mcpTools = require('./mcp-tools.service');

const USER_ID = 'user-123';

describe('mcp-tools.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('helpers', () => {
    test('buildQueryString combines text and [tag] encoding', () => {
      expect(mcpTools.buildQueryString('kubernetes ingress', ['devops'])).toBe(
        'kubernetes ingress [devops]'
      );
      expect(mcpTools.buildQueryString('', ['a', 'b'])).toBe('[a] [b]');
      expect(mcpTools.buildQueryString('  ', [])).toBe('');
    });

    test('clampLimit enforces bounds and defaults', () => {
      expect(mcpTools.clampLimit(10)).toBe(10);
      expect(mcpTools.clampLimit(999)).toBe(mcpTools.MAX_LIMIT);
      expect(mcpTools.clampLimit(0)).toBe(mcpTools.DEFAULT_LIMIT);
      expect(mcpTools.clampLimit('abc')).toBe(mcpTools.DEFAULT_LIMIT);
    });

    test('normalizePage defaults invalid pages to 1', () => {
      expect(mcpTools.normalizePage(3)).toBe(3);
      expect(mcpTools.normalizePage(0)).toBe(1);
      expect(mcpTools.normalizePage('x')).toBe(1);
    });

    test('toExcerpt truncates long text', () => {
      const long = 'a'.repeat(mcpTools.EXCERPT_LENGTH + 50);
      const excerpt = mcpTools.toExcerpt(long);
      expect(excerpt.length).toBe(mcpTools.EXCERPT_LENGTH + 1); // +1 for ellipsis
      expect(mcpTools.toExcerpt('')).toBe('');
    });
  });

  describe('searchEntries', () => {
    test('searches both bookmarks and notes by default and normalizes results', async () => {
      bookmarksSearchService.findPersonalBookmarks.mockResolvedValue([
        {
          _id: 'b1',
          name: 'K8s ingress guide',
          location: 'https://example.com/k8s',
          tags: ['devops'],
          description: 'How to set up ingress',
          public: true,
        },
      ]);
      notesSearchService.findPersonalNotes.mockResolvedValue([
        {
          _id: 'n1',
          title: 'Ingress notes',
          tags: ['devops'],
          content: 'nginx ingress controller',
          contentType: 'markdown',
        },
      ]);

      const result = await mcpTools.searchEntries(USER_ID, {
        text: 'ingress',
        tags: ['devops'],
      });

      expect(bookmarksSearchService.findPersonalBookmarks).toHaveBeenCalledWith(
        USER_ID,
        'ingress [devops]',
        1,
        mcpTools.DEFAULT_LIMIT,
        false
      );
      expect(notesSearchService.findPersonalNotes).toHaveBeenCalledWith(
        USER_ID,
        'ingress [devops]',
        1,
        mcpTools.DEFAULT_LIMIT,
        false
      );
      expect(result.count).toBe(2);
      expect(result.results[0]).toMatchObject({
        type: 'bookmark',
        id: 'b1',
        title: 'K8s ingress guide',
        url: 'https://example.com/k8s',
        public: true,
      });
      expect(result.results[1]).toMatchObject({
        type: 'note',
        id: 'n1',
        title: 'Ingress notes',
        contentType: 'markdown',
      });
    });

    test('restricts to requested types', async () => {
      notesSearchService.findPersonalNotes.mockResolvedValue([]);

      await mcpTools.searchEntries(USER_ID, { text: 'x', types: ['note'] });

      expect(bookmarksSearchService.findPersonalBookmarks).not.toHaveBeenCalled();
      expect(notesSearchService.findPersonalNotes).toHaveBeenCalledTimes(1);
    });

    test('clamps the limit to MAX_LIMIT', async () => {
      bookmarksSearchService.findPersonalBookmarks.mockResolvedValue([]);
      notesSearchService.findPersonalNotes.mockResolvedValue([]);

      const result = await mcpTools.searchEntries(USER_ID, {
        text: 'x',
        limit: 500,
      });

      expect(result.limit).toBe(mcpTools.MAX_LIMIT);
    });
  });

  describe('getEntry', () => {
    test('returns full bookmark with description', async () => {
      personalBookmarksService.getBookmarkById.mockResolvedValue({
        _id: 'b1',
        name: 'Bookmark',
        location: 'https://example.com',
        tags: [],
        description: 'full description',
        public: false,
      });

      const entry = await mcpTools.getEntry(USER_ID, {
        id: 'b1',
        type: 'bookmark',
      });

      expect(personalBookmarksService.getBookmarkById).toHaveBeenCalledWith(
        USER_ID,
        'b1'
      );
      expect(entry.type).toBe('bookmark');
      expect(entry.description).toBe('full description');
    });

    test('returns full note with content', async () => {
      personalNotesService.getNoteById.mockResolvedValue({
        _id: 'n1',
        title: 'Note',
        tags: [],
        content: 'full note content',
        contentType: 'markdown',
      });

      const entry = await mcpTools.getEntry(USER_ID, { id: 'n1', type: 'note' });

      expect(entry.type).toBe('note');
      expect(entry.content).toBe('full note content');
    });

    test('throws when id or type missing', async () => {
      await expect(mcpTools.getEntry(USER_ID, {})).rejects.toThrow(
        'get_entry requires both "id" and "type"'
      );
    });

    test('throws for unsupported type', async () => {
      await expect(
        mcpTools.getEntry(USER_ID, { id: 'x', type: 'snippet' })
      ).rejects.toThrow('Unsupported entry type: snippet');
    });
  });

  describe('listTags', () => {
    test('merges bookmark and note tag counts sorted by count desc', async () => {
      personalBookmarksService.getUserTagsAggregated.mockResolvedValue([
        { name: 'devops', count: 3 },
        { name: 'k8s', count: 1 },
      ]);
      personalNotesService.getUserNoteTags.mockResolvedValue([
        { name: 'devops', count: 2 },
        { name: 'notes', count: 5 },
      ]);

      const tags = await mcpTools.listTags(USER_ID);

      expect(tags).toEqual([
        { name: 'devops', count: 5 },
        { name: 'notes', count: 5 },
        { name: 'k8s', count: 1 },
      ]);
    });

    test('restricts to bookmark tags when type=bookmark', async () => {
      personalBookmarksService.getUserTagsAggregated.mockResolvedValue([
        { name: 'devops', count: 3 },
      ]);

      const tags = await mcpTools.listTags(USER_ID, { type: 'bookmark' });

      expect(personalNotesService.getUserNoteTags).not.toHaveBeenCalled();
      expect(tags).toEqual([{ name: 'devops', count: 3 }]);
    });
  });
});

