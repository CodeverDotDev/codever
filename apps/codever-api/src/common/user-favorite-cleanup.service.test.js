jest.mock('../model/user', () => ({
  updateMany: jest.fn(),
}));

const User = require('../model/user');
const {
  removeBookmarkFavoriteReferences,
  removeNoteFavoriteReferences,
} = require('./user-favorite-cleanup.service');

beforeEach(() => {
  jest.clearAllMocks();
  User.updateMany.mockResolvedValue({ modifiedCount: 2 });
});

test('removes bookmark favorites from all matching user profiles', async () => {
  await removeBookmarkFavoriteReferences(['bookmark-1', 'bookmark-2']);

  expect(User.updateMany).toHaveBeenCalledWith(
    { favorites: { $in: ['bookmark-1', 'bookmark-2'] } },
    { $pull: { favorites: { $in: ['bookmark-1', 'bookmark-2'] } } }
  );
});

test('removes note favorites and skips empty ID lists', async () => {
  await removeNoteFavoriteReferences(['note-1', 'note-1']);
  await removeNoteFavoriteReferences([]);

  expect(User.updateMany).toHaveBeenCalledTimes(1);
  expect(User.updateMany).toHaveBeenCalledWith(
    { favoriteNotes: { $in: ['note-1'] } },
    { $pull: { favoriteNotes: { $in: ['note-1'] } } }
  );
});
