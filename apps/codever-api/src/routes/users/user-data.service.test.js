const UserDataService = require('./user-data.service');
const User = require('../../model/user');
const Bookmark = require('../../model/bookmark');
const Note = require('../../model/note');
const Collection = require('../../model/collection');
const NotFoundError = require('../../error/not-found.error');
const ValidationError = require('../../error/validation.error');

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

describe('UserDataService.updateUserDataPinned', () => {
  const userId = 'test-user-id';

  afterEach(() => jest.restoreAllMocks());

  it('stores typed entries as provided', async () => {
    User.findOneAndUpdate = jest.fn().mockResolvedValue({});
    const typedEntries = [
      { type: 'bookmark', id: 'bookmark-1' },
      { type: 'note', id: 'note-1' },
      { type: 'collection', id: 'collection-1' },
    ];

    await UserDataService.updateUserDataPinned(typedEntries, userId);

    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      { userId },
      { $set: { pinned: typedEntries } }
    );
  });

  it('trims typed entries to the max store length', async () => {
    User.findOneAndUpdate = jest.fn().mockResolvedValue({});
    const typedEntries = Array.from({ length: 55 }, (_, index) => ({
      type: 'bookmark',
      id: `bookmark-${index}`,
    }));

    await UserDataService.updateUserDataPinned(typedEntries, userId);

    const update = User.findOneAndUpdate.mock.calls[0][1];
    expect(update.$set.pinned).toHaveLength(50);
    expect(update.$set.pinned[0]).toEqual({ type: 'bookmark', id: 'bookmark-0' });
    expect(update.$set.pinned[49]).toEqual({
      type: 'bookmark',
      id: 'bookmark-49',
    });
  });

  it('throws ValidationError for an invalid pinned entry type', async () => {
    User.findOneAndUpdate = jest.fn().mockResolvedValue({});

    await expect(
      UserDataService.updateUserDataPinned(
        [{ type: 'bogus', id: 'id-1' }],
        userId
      )
    ).rejects.toThrow(ValidationError);
    expect(User.findOneAndUpdate).not.toHaveBeenCalled();
  });
});

describe('UserDataService.updateUserDataHistoryReadLaterPinned', () => {
  const userId = 'test-user-id';

  afterEach(() => jest.restoreAllMocks());

  it('stores typed pinned entries and trims them', async () => {
    User.findOneAndUpdate = jest.fn().mockResolvedValue({});
    const pinned = Array.from({ length: 55 }, (_, index) => ({
      type: 'collection',
      id: `collection-${index}`,
    }));

    await UserDataService.updateUserDataHistoryReadLaterPinned(
      { history: ['h1'], pinned },
      userId
    );

    const update = User.findOneAndUpdate.mock.calls[0][1];
    expect(update.$set.pinned).toHaveLength(50);
    expect(update.$set.pinned[0]).toEqual({
      type: 'collection',
      id: 'collection-0',
    });
  });

  it('leaves pinned untouched when no pinned entries are provided', async () => {
    User.findOneAndUpdate = jest.fn().mockResolvedValue({});

    await UserDataService.updateUserDataHistoryReadLaterPinned(
      { history: ['h1'] },
      userId
    );

    const update = User.findOneAndUpdate.mock.calls[0][1];
    expect(update.$set.pinned).toBeUndefined();
  });

  it('throws ValidationError for an invalid pinned entry type', async () => {
    User.findOneAndUpdate = jest.fn().mockResolvedValue({});

    await expect(
      UserDataService.updateUserDataHistoryReadLaterPinned(
        { history: ['h1'], pinned: [{ type: 'bogus', id: 'id-1' }] },
        userId
      )
    ).rejects.toThrow(ValidationError);
  });
});
