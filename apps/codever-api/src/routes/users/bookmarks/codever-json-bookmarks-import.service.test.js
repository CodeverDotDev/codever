jest.mock('../../../model/bookmark', () => {
  const Bookmark = jest.fn(function (data) {
    Object.assign(this, data);
    this.save = jest.fn(async () => this);
  });
  Bookmark.find = jest.fn();
  Bookmark.findOne = jest.fn();
  return Bookmark;
});

const Bookmark = require('../../../model/bookmark');
const ValidationError = require('../../../error/validation.error');
const {
  importCodeverJsonBookmarks,
} = require('./codever-json-bookmarks-import.service');

const USER_ID = 'user-b';
const DISPLAY_NAME = 'New Me';

/** A bookmark as it appears in a Codever JSON export file. */
function exported(overrides = {}) {
  return {
    _id: '64a000000000000000000001',
    name: 'Example',
    type: 'bookmark',
    location: 'https://example.com',
    description: '**fast** parser',
    tags: ['java'],
    copyableFields: [],
    userId: 'user-a',
    userDisplayName: 'Old Me',
    public: false,
    likeCount: 42,
    shareableId: 'share-123',
    createdAt: '2021-03-04T10:00:00.000Z',
    updatedAt: '2022-01-01T00:00:00.000Z',
    __v: 0,
    ...overrides,
  };
}

function mockExistingLocations(locations) {
  Bookmark.find.mockReturnValue({
    lean: () => ({
      exec: async () => locations.map((location) => ({ location })),
    }),
  });
}

function mockPublicBookmarkExists(exists) {
  Bookmark.findOne.mockReturnValue({
    lean: () => ({
      exec: async () => (exists ? { _id: 'other' } : null),
    }),
  });
}

const restore = (bookmarks, options = {}) =>
  importCodeverJsonBookmarks(USER_ID, bookmarks, {
    userDisplayName: DISPLAY_NAME,
    ...options,
  });

describe('importCodeverJsonBookmarks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExistingLocations([]);
    mockPublicBookmarkExists(false);
  });

  describe('request', () => {
    it.each([undefined, null, { name: 'x' }, 'bookmarks'])(
      'rejects %p as bookmarks without creating anything',
      async (bookmarks) => {
        await expect(restore(bookmarks)).rejects.toBeInstanceOf(
          ValidationError
        );
        expect(Bookmark).not.toHaveBeenCalled();
      }
    );

    it('returns zero counts for an empty export', async () => {
      const result = await restore([]);

      expect(result).toEqual({
        created: [],
        duplicatesSize: 0,
        inErrorSize: 0,
        madePrivateSize: 0,
      });
      expect(Bookmark.find).not.toHaveBeenCalled();
    });
  });

  describe('restored fields', () => {
    it('assigns the logged-in user and ignores owner, id, likes and share link', async () => {
      const { created } = await restore([exported()]);

      expect(created).toHaveLength(1);
      const data = Bookmark.mock.calls[0][0];
      expect(data.userId).toBe(USER_ID);
      expect(data.userDisplayName).toBe(DISPLAY_NAME);
      expect(data.likeCount).toBe(0);
      expect(data.type).toBe('bookmark');
      expect(data).not.toHaveProperty('_id');
      expect(data).not.toHaveProperty('shareableId');
      expect(data).not.toHaveProperty('__v');
      expect(data.name).toBe('Example');
      expect(data.location).toBe('https://example.com');
      expect(data.tags).toEqual(['java']);
    });

    it('generates descriptionHtml from description and ignores the file value', async () => {
      await restore([
        exported({ descriptionHtml: '<script>alert(1)</script>' }),
      ]);

      const data = Bookmark.mock.calls[0][0];
      expect(data.descriptionHtml).toContain('<strong>fast</strong>');
      expect(data.descriptionHtml).not.toContain('script');
    });

    it('ignores fields that are not restored and non-string values', async () => {
      await restore([
        exported({
          lastAccessedAt: '2025-01-01T00:00:00.000Z',
          ownerVisitCount: 9,
          initiator: 'x',
          language: { $gt: '' },
        }),
      ]);

      const data = Bookmark.mock.calls[0][0];
      expect(data).not.toHaveProperty('lastAccessedAt');
      expect(data).not.toHaveProperty('ownerVisitCount');
      expect(data).not.toHaveProperty('initiator');
      expect(data).not.toHaveProperty('language');
    });

    it('normalises tags as on creation', async () => {
      await restore([exported({ tags: [' Java ', 'java', 'Spring Boot'] })]);

      expect(Bookmark.mock.calls[0][0].tags).toEqual(
        expect.arrayContaining(['java'])
      );
      expect(Bookmark.mock.calls[0][0].tags).not.toContain(' Java ');
    });
  });

  describe('existing bookmarks take precedence', () => {
    it('skips a URL the user already has and does not change it', async () => {
      mockExistingLocations(['https://example.com']);

      const result = await restore([
        exported({ tags: ['design'] }),
        exported({ location: 'https://new.dev' }),
      ]);

      expect(result.created).toHaveLength(1);
      expect(result.created[0].location).toBe('https://new.dev');
      expect(result.duplicatesSize).toBe(1);
      expect(Bookmark.find).toHaveBeenCalledWith(
        { userId: USER_ID },
        { location: 1 }
      );
      expect(Bookmark.findOne).not.toHaveBeenCalled();
    });

    it('restores only the first of repeated URLs in the file', async () => {
      const result = await restore([
        exported({ name: 'Newest' }),
        exported({ name: 'Older' }),
      ]);

      expect(result.created.map((b) => b.name)).toEqual(['Newest']);
      expect(result.duplicatesSize).toBe(1);
    });

    it('creates nothing when the same file is restored twice', async () => {
      const file = [
        exported(),
        exported({ location: 'https://second.dev' }),
      ];
      const first = await restore(file);
      mockExistingLocations(first.created.map((b) => b.location));

      const second = await restore(file);

      expect(second.created).toHaveLength(0);
      expect(second.duplicatesSize).toBe(2);
    });
  });

  describe('invalid bookmarks', () => {
    it('counts an entry without location and restores the rest', async () => {
      const result = await restore([
        exported({ location: 'https://a.dev' }),
        exported({ location: undefined }),
        exported({ location: 'https://c.dev' }),
      ]);

      expect(result.created).toHaveLength(2);
      expect(result.inErrorSize).toBe(1);
    });

    it.each([
      ['no name', { name: '' }],
      ['no tags', { tags: [] }],
      ['a blocked tag', { tags: ['awesome-list'] }],
      ['broken copyable fields', { copyableFields: 'nope' }],
    ])('counts a bookmark with %s as invalid', async (_, overrides) => {
      const result = await restore([exported(overrides)]);

      expect(result.created).toHaveLength(0);
      expect(result.inErrorSize).toBe(1);
    });

    it('accepts null copyable fields', async () => {
      const result = await restore([exported({ copyableFields: null })]);

      expect(result.created).toHaveLength(1);
    });

    it('lets a later valid copy of an invalid entry through', async () => {
      const result = await restore([
        exported({ name: '' }),
        exported({ name: 'Valid' }),
      ]);

      expect(result.created.map((b) => b.name)).toEqual(['Valid']);
      expect(result.inErrorSize).toBe(1);
      expect(result.duplicatesSize).toBe(0);
    });
  });

  describe('visibility', () => {
    it('restores public bookmarks as private by default', async () => {
      await restore([exported({ public: true })]);

      expect(Bookmark.mock.calls[0][0].public).toBe(false);
      expect(Bookmark.findOne).not.toHaveBeenCalled();
    });

    it('keeps public visibility when asked and no public duplicate exists', async () => {
      const result = await restore([exported({ public: true })], {
        keepPublic: true,
      });

      expect(result.created[0].public).toBe(true);
      expect(result.madePrivateSize).toBe(0);
    });

    it('makes it private when another public bookmark has the URL', async () => {
      mockPublicBookmarkExists(true);

      const result = await restore([exported({ public: true })], {
        keepPublic: true,
      });

      expect(result.created[0].public).toBe(false);
      expect(result.madePrivateSize).toBe(1);
    });

    it('keeps private bookmarks private with keepPublic', async () => {
      await restore([exported({ public: false })], { keepPublic: true });

      expect(Bookmark.mock.calls[0][0].public).toBe(false);
    });
  });

  describe('dates', () => {
    it('keeps the original dates and saves without automatic timestamps', async () => {
      const { created } = await restore([exported()]);

      expect(created[0].createdAt).toEqual(
        new Date('2021-03-04T10:00:00.000Z')
      );
      expect(created[0].updatedAt).toEqual(
        new Date('2022-01-01T00:00:00.000Z')
      );
      expect(created[0].save).toHaveBeenCalledWith({ timestamps: false });
    });

    it.each([
      ['missing', undefined],
      ['invalid', 'yesterday'],
      ['in the future', '2999-01-01T00:00:00.000Z'],
    ])('uses the restore time when createdAt is %s', async (_, createdAt) => {
      const before = Date.now();

      const { created } = await restore([
        exported({ createdAt, updatedAt: undefined }),
      ]);

      expect(created[0].createdAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(created[0].createdAt.getTime()).toBeLessThanOrEqual(Date.now());
      expect(created[0].updatedAt).toEqual(created[0].createdAt);
    });

    it('never sets updatedAt before createdAt', async () => {
      const { created } = await restore([
        exported({ updatedAt: '2020-01-01T00:00:00.000Z' }),
      ]);

      expect(created[0].updatedAt).toEqual(created[0].createdAt);
    });
  });

  it('reports a mixed result', async () => {
    mockExistingLocations(['https://saved.dev']);

    const result = await restore([
      exported({ location: 'https://1.dev' }),
      exported({ location: 'https://2.dev' }),
      exported({ location: 'https://3.dev' }),
      exported({ location: 'https://saved.dev' }),
      exported({ location: 'https://5.dev', name: undefined }),
    ]);

    expect(result.created).toHaveLength(3);
    expect(result.duplicatesSize).toBe(1);
    expect(result.inErrorSize).toBe(1);
    expect(result.madePrivateSize).toBe(0);
  });
});
