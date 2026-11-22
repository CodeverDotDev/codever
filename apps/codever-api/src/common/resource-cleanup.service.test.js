jest.mock('../model/user', () => ({ updateMany: jest.fn() }));
jest.mock('../routes/users/share-link.service', () => ({
  revokeResourceLinks: jest.fn(),
  revokeDeletedResourceLinks: jest.fn(),
}));
jest.mock('./user-favorite-cleanup.service', () => ({
  removeBookmarkFavoriteReferences: jest.fn(),
  removeNoteFavoriteReferences: jest.fn(),
}));

const User = require('../model/user');
const ShareLinkService = require('../routes/users/share-link.service');
const FavoriteCleanup = require('./user-favorite-cleanup.service');
const {
  cleanupDeletedBookmarks,
  cleanupDeletedNotes,
} = require('./resource-cleanup.service');

beforeEach(() => jest.clearAllMocks());

describe('cleanupDeletedBookmarks', () => {
  test('pulls bookmark ids from all user lists and favorites', async () => {
    await cleanupDeletedBookmarks(['b1', 'b2', 'b1']);

    expect(FavoriteCleanup.removeBookmarkFavoriteReferences).toHaveBeenCalledWith(
      ['b1', 'b2']
    );
    expect(User.updateMany).toHaveBeenCalledWith(
      {},
      {
        $pull: {
          readLater: { $in: ['b1', 'b2'] },
          likes: { $in: ['b1', 'b2'] },
          pinned: { id: { $in: ['b1', 'b2'] }, type: 'bookmark' },
          history: { $in: ['b1', 'b2'] },
        },
      }
    );
  });

  test('revokes all links without owner, only the owner links with owner', async () => {
    await cleanupDeletedBookmarks(['b1']);
    expect(ShareLinkService.revokeDeletedResourceLinks).toHaveBeenCalledWith(
      'bookmark',
      ['b1']
    );
    expect(ShareLinkService.revokeResourceLinks).not.toHaveBeenCalled();

    await cleanupDeletedBookmarks(['b1'], 'owner');
    expect(ShareLinkService.revokeResourceLinks).toHaveBeenCalledWith(
      'owner',
      'bookmark',
      ['b1']
    );
  });

  test('does nothing for an empty list', async () => {
    await cleanupDeletedBookmarks([]);
    expect(User.updateMany).not.toHaveBeenCalled();
    expect(ShareLinkService.revokeDeletedResourceLinks).not.toHaveBeenCalled();
  });
});

describe('cleanupDeletedNotes', () => {
  test('pulls note ids from pinned and history and removes favorites', async () => {
    await cleanupDeletedNotes(['n1']);

    expect(ShareLinkService.revokeDeletedResourceLinks).toHaveBeenCalledWith(
      'note',
      ['n1']
    );
    expect(FavoriteCleanup.removeNoteFavoriteReferences).toHaveBeenCalledWith([
      'n1',
    ]);
    expect(User.updateMany).toHaveBeenCalledWith(
      {},
      {
        $pull: {
          pinned: { id: { $in: ['n1'] }, type: 'note' },
          history: { $in: ['n1'] },
        },
      }
    );
  });
});
