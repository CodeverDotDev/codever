jest.mock('../../../model/bookmark', () => ({
  deleteMany: jest.fn(),
  deleteOne: jest.fn(),
  find: jest.fn(),
  findOneAndDelete: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));
jest.mock('../../../model/user', () => ({
  updateMany: jest.fn(),
  updateOne: jest.fn(),
}));
jest.mock('../../../common/user-favorite-cleanup.service', () => ({
  removeBookmarkFavoriteReferences: jest.fn(),
}));
jest.mock('../share-link.service', () => ({
  revokeResourceLinks: jest.fn(),
}));

const Bookmark = require('../../../model/bookmark');
const ShareLinkService = require('../share-link.service');
const ValidationError = require('../../../error/validation.error');
const personal = require('./personal-bookmarks.service');
const admin = require('../../admin/admin.service');
const tags = (count) => Array.from({ length: count }, (_, i) => `tag-${i}`);
const save = jest.fn();
const bookmark = (input) => ({
  _id: 'bookmark-id', userId: 'owner', name: 'Bookmark',
  location: 'https://example.com', public: false, tags: input,
  save: function () { return save(this); },
});

beforeEach(() => {
  jest.clearAllMocks();
  save.mockImplementation(async (data) => data);
  Bookmark.findOneAndUpdate.mockImplementation(async (filter, data) => data);
});

describe.each([
  ['personal create', (data) => personal.createBookmark('owner', data)],
  ['personal update', (data) => personal.updateBookmark('owner', 'bookmark-id', data)],
  ['admin create', (data) => admin.createBookmark(data)],
  ['admin update', (data) => admin.updateBookmark(data)],
])('%s tag policy', (name, write) => {
  test('persists thirteen normalized unique tags', async () => {
    const result = await write(bookmark([...tags(13), ' TAG-0 ']));
    expect(result.tags).toEqual(tags(13));
    expect(save.mock.calls.length + Bookmark.findOneAndUpdate.mock.calls.length).toBe(1);
  });

  describe('bookmark deletion sharing cleanup', () => {
    test('revokes the link when deleting one bookmark by id', async () => {
      Bookmark.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await personal.deleteBookmarkById('owner', 'bookmark-id');

      expect(ShareLinkService.revokeResourceLinks).toHaveBeenCalledWith(
        'owner',
        'bookmark',
        ['bookmark-id']
      );
    });

    test('revokes the link when deleting one bookmark by location', async () => {
      Bookmark.findOneAndDelete.mockResolvedValue({ _id: 'bookmark-id' });

      await personal.deleteBookmarkByLocation('owner', 'https://example.com');

      expect(ShareLinkService.revokeResourceLinks).toHaveBeenCalledWith(
        'owner',
        'bookmark',
        ['bookmark-id']
      );
    });

    test('revokes links for bookmarks deleted by private tag', async () => {
      Bookmark.find.mockResolvedValue([{ _id: 'bookmark-id' }]);
      Bookmark.deleteMany.mockResolvedValue({ deletedCount: 1 });

      await personal.deletePrivateBookmarksByTag('owner', 'tag');

      expect(ShareLinkService.revokeResourceLinks).toHaveBeenCalledWith(
        'owner',
        'bookmark',
        ['bookmark-id']
      );
    });
  });

  test.each([
    tags(14), [], undefined, 'tag', ['valid', 1], [''], [' Awesome-js '],
  ].map((input) => [input]))('rejects invalid input before persistence: %j', async (input) => {
    await expect(write(bookmark(input))).rejects.toBeInstanceOf(ValidationError);
    expect(save).not.toHaveBeenCalled();
    expect(Bookmark.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test.each(['shareableId', 'shareLinkId', 'shareToken', 'token'])(
    'rejects caller-supplied %s for bookmark writes',
    async (field) => {
      const input = bookmark(['valid']);
      input[field] = 'caller-controlled';

      await expect(write(input)).rejects.toBeInstanceOf(ValidationError);
      expect(save).not.toHaveBeenCalled();
      expect(Bookmark.findOneAndUpdate).not.toHaveBeenCalled();
    }
  );
});
