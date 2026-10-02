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
  createNote: jest.fn(),
  getNoteById: jest.fn(),
  getUserNoteTags: jest.fn(),
}));
jest.mock('../common/config', () => ({ config: jest.fn() }));
jest.mock('../common/feature-toggle.service', () => ({
  isMcpServerEnabled: jest.fn(), isMcpCreateNotesEnabled: jest.fn(),
}));
const common = require('../common/config');
const toggles = require('../common/feature-toggle.service');
const { creationErrorMessage } = require('./mcp-note-creation');
const NotFoundError = require('../error/not-found.error');

const bookmarksSearchService = require('../common/searching/bookmarks-search.service');
const notesSearchService = require('../routes/users/notes/notes-search.service');
const personalBookmarksService = require('../routes/users/bookmarks/personal-bookmarks.service');
const personalNotesService = require('../routes/users/notes/personal-notes.service');

const mcpTools = require('./mcp-tools.service');

const USER_ID = 'user-123';

describe('MCP Markdown creation service', () => {
  const scopes = ['mcp:read', 'mcp:write'];
  const draft = { title: 'Example', content: '  # Prose\n\n```js\nconst x = 1;\n```\n\n```sh\necho hi\n```\n' };
  const timestamp = new Date('2026-10-02T00:00:00Z');
  beforeEach(() => {
    jest.clearAllMocks();
    toggles.isMcpServerEnabled.mockReturnValue(true);
    toggles.isMcpCreateNotesEnabled.mockReturnValue(true);
    common.config.mockReturnValue({ mcp: { frontendBaseUrl: 'http://localhost:4200/' } });
    personalNotesService.createNote.mockImplementation(async (userId, payload) => ({
      ...payload, _id: 'saved-id', createdAt: timestamp, updatedAt: timestamp,
      shareableId: 'never-expose', initiator: 'internal', __v: 0,
    }));
  });

  test('saves a fresh private Markdown payload with token ownership and exact content', async () => {
    const args = Object.freeze({ ...draft });
    const result = await mcpTools.createNote(USER_ID, args, scopes);
    expect(personalNotesService.createNote).toHaveBeenCalledWith(USER_ID, {
      ...draft, userId: USER_ID, type: 'note', contentType: 'markdown', public: false, tags: [],
    });
    expect(result).toEqual({
      id: 'saved-id', type: 'note', title: draft.title, contentType: 'markdown', public: false, tags: [],
      createdAt: timestamp, updatedAt: timestamp, url: 'http://localhost:4200/my-notes/saved-id/details',
    });
    expect(result).not.toHaveProperty('content');
    expect(result).not.toHaveProperty('userId');
    expect(result).not.toHaveProperty('shareableId');
    expect(result).not.toHaveProperty('origin');
    expect(args).toEqual(draft);
  });

  test('explicit public visibility, normalized tags and partial origin round-trip', async () => {
    const origin = { project: 'Codever', file: 'src/example.js' };
    const reference = 'https://example.com/source';
    const result = await mcpTools.createNote(USER_ID, {
      ...draft, tags: [' JavaScript ', 'javascript', 'API'], public: true, origin, reference,
    }, scopes);
    expect(result).toMatchObject({ tags: ['javascript', 'api'], public: true, origin, reference });
    const payload = personalNotesService.createNote.mock.calls[0][1];
    expect(payload.origin).toEqual(origin);
    expect(payload.origin).not.toBe(origin);
    personalNotesService.getNoteById.mockImplementation(async (userId) => {
      if (userId !== USER_ID) throw new NotFoundError('Not found');
      return { ...payload, _id: result.id };
    });
    const read = await mcpTools.getEntry(USER_ID, { id: result.id, type: 'note' });
    expect(read).toMatchObject({ origin, reference, content: draft.content, tags: ['javascript', 'api'] });
    expect(read.origin).not.toHaveProperty('workspace');
    await expect(mcpTools.getEntry('other', { id: result.id, type: 'note' })).rejects.toThrow(NotFoundError);
  });

  test('preserves all four supplied origin fields without fetching their values', async () => {
    const origin = { location: 'file:///local/code.js', file: 'code.js', project: 'P', workspace: 'W' };
    expect((await mcpTools.createNote(USER_ID, { ...draft, origin }, scopes)).origin).toEqual(origin);
  });

  test('accepts thirteen unique tags after deduplication, rejects fourteen before saving', async () => {
    const tags = Array.from({ length: 13 }, (_, i) => `tag-${i}`);
    expect((await mcpTools.createNote(USER_ID, { ...draft, tags: [...tags, ' TAG-0 '] }, scopes)).tags).toEqual(tags);
    personalNotesService.createNote.mockClear();
    await expect(mcpTools.createNote(USER_ID, { ...draft, tags: [...tags, 'extra'] }, scopes)).rejects.toMatchObject({ validationErrors: ['Too many tags - max 13 allowed'] });
    expect(personalNotesService.createNote).not.toHaveBeenCalled();
  });

  test.each([
    [false, true, scopes], [true, false, scopes], [true, true, ['mcp:read']],
    [true, true, ['mcp:write']], [true, true, []],
  ])('no persistence for server=%s creation=%s scopes=%j', async (server, creation, granted) => {
    toggles.isMcpServerEnabled.mockReturnValue(server);
    toggles.isMcpCreateNotesEnabled.mockReturnValue(creation);
    await expect(mcpTools.createNote(USER_ID, draft, granted)).rejects.toThrow('requires');
    expect(personalNotesService.createNote).not.toHaveBeenCalled();
  });

  test.each([
    { userId: 'other' }, { contentType: 'notebook' }, { notebookContent: '{}' }, { collectionIds: [] },
    { _id: 'id' }, { shareableId: 'shared' }, { tags: [''] }, { tags: [' '] }, { tags: [2] },
    { tags: null }, { tags: 'tag' }, { origin: { secret: 'hidden' } }, { public: 'true' },
    { title: ' ' }, { content: ' ' }, { content: 'x'.repeat(30001) },
  ])('direct service callers cannot bypass validation %#', async (extra) => {
    await expect(mcpTools.createNote(USER_ID, { ...draft, ...extra }, scopes)).rejects.toThrow();
    expect(personalNotesService.createNote).not.toHaveBeenCalled();
  });

  test.each([undefined, null, '', '/relative', 'invalid', 'ftp://example.com',
    'https://user:password@example.com', 'https://example.com?token=secret', 'https://example.com/#hash', ' https://example.com'])
  ('rejects invalid frontend base %# before saving without disabling reads', async (frontendBaseUrl) => {
    common.config.mockReturnValue({ mcp: { frontendBaseUrl } });
    await expect(mcpTools.createNote(USER_ID, draft, scopes)).rejects.toThrow('mcp.frontendBaseUrl');
    expect(personalNotesService.createNote).not.toHaveBeenCalled();
    personalNotesService.getNoteById.mockResolvedValue({ _id: 'existing', content: 'readable' });
    expect((await mcpTools.getEntry(USER_ID, { id: 'existing', type: 'note' })).content).toBe('readable');
  });

  test.each(['https://www.codever.dev', 'https://www.codever.dev/', 'https://www.codever.dev///'])
  ('uses configured production base %s', async (frontendBaseUrl) => {
    common.config.mockReturnValue({ mcp: { frontendBaseUrl } });
    expect((await mcpTools.createNote(USER_ID, draft, scopes)).url).toBe('https://www.codever.dev/my-notes/saved-id/details');
  });

  test('missing mcp config fails before saving', async () => {
    common.config.mockReturnValue({});
    await expect(mcpTools.createNote(USER_ID, draft, scopes)).rejects.toThrow('No note was saved');
    expect(personalNotesService.createNote).not.toHaveBeenCalled();
  });

  test('persistence failure produces only a sanitized failure, never a claimed link', async () => {
    personalNotesService.createNote.mockRejectedValue(new Error('database secret'));
    await expect(mcpTools.createNote(USER_ID, draft, scopes)).rejects.toThrow('database secret');
    const message = creationErrorMessage(new Error('database secret'));
    expect(message).toContain('Do not retry blindly');
    expect(message).not.toMatch(/secret|\/my-notes\//);
  });
});

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

