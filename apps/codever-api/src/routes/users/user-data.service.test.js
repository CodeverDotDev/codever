const UserDataService = require('./user-data.service');
const User = require('../../model/user');
const Bookmark = require('../../model/bookmark');
const Note = require('../../model/note');
const Collection = require('../../model/collection');
const NotFoundError = require('../../error/not-found.error');

jest.mock('../../model/user');
jest.mock('../../model/bookmark');
jest.mock('../../model/note');
jest.mock('../../model/collection');

describe('UserDataService.getPinnedResources', () => {
  const userId = 'test-user-id';

  afterEach(() => jest.restoreAllMocks());

  it('throws NotFoundError when the user has no user data', async () => {
    User.findOne = jest.fn().mockResolvedValue(null);

    await expect(
      UserDataService.getPinnedResources(userId, 1, 10)
    ).rejects.toThrow(NotFoundError);
  });

  it('resolves typed bookmark, note, and collection entries in pinned order', async () => {
    User.findOne = jest.fn().mockResolvedValue({
      pinned: [
        { type: 'note', id: 'note-1' },
        { type: 'bookmark', id: 'bookmark-1' },
        { type: 'collection', id: 'collection-1' },
      ],
    });
    Bookmark.find = jest
      .fn()
      .mockResolvedValue([{ _id: 'bookmark-1', name: 'bookmark one' }]);
    Note.find = jest
      .fn()
      .mockResolvedValue([{ _id: 'note-1', title: 'note one' }]);
    Collection.find = jest.fn().mockResolvedValue([
      {
        _id: 'collection-1',
        name: 'collection one',
        color: '#ff0000',
        userId,
        items: [{ resourceId: 'bookmark-1', resourceType: 'bookmark' }],
      },
    ]);

    const result = await UserDataService.getPinnedResources(userId, 1, 10);

    // Order follows the user's pinned entries, not the query results.
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ _id: 'note-1', title: 'note one' });
    expect(result[1]).toEqual({ _id: 'bookmark-1', name: 'bookmark one' });
    expect(result[2]).toEqual({
      _id: 'collection-1',
      type: 'collection',
      name: 'collection one',
      color: '#ff0000',
      userId,
    });

    // Collections are returned light, without their populated items.
    expect(result[2].items).toBeUndefined();

    // Each type is resolved against its own model with only its own ids.
    expect(Bookmark.find).toHaveBeenCalledWith({
      _id: { $in: ['bookmark-1'] },
    });
    expect(Note.find).toHaveBeenCalledWith({ _id: { $in: ['note-1'] } });
    expect(Collection.find).toHaveBeenCalledWith({
      _id: { $in: ['collection-1'] },
    });
  });

  it('drops pinned entries whose resource no longer exists', async () => {
    User.findOne = jest.fn().mockResolvedValue({
      pinned: [
        { type: 'bookmark', id: 'bookmark-1' },
        { type: 'bookmark', id: 'bookmark-deleted' },
        { type: 'note', id: 'note-1' },
      ],
    });
    Bookmark.find = jest
      .fn()
      .mockResolvedValue([{ _id: 'bookmark-1', name: 'bookmark one' }]);
    Note.find = jest
      .fn()
      .mockResolvedValue([{ _id: 'note-1', title: 'note one' }]);
    Collection.find = jest.fn().mockResolvedValue([]);

    const result = await UserDataService.getPinnedResources(userId, 1, 10);

    expect(result).toEqual([
      { _id: 'bookmark-1', name: 'bookmark one' },
      { _id: 'note-1', title: 'note one' },
    ]);
  });
});
