jest.mock('../../model/bookmark', () => ({
  deleteMany: jest.fn(),
  deleteOne: jest.fn(),
  find: jest.fn(),
  findOneAndDelete: jest.fn(),
}));
jest.mock('../../model/note', () => ({
  findOneAndDelete: jest.fn(),
}));
jest.mock('../../model/user', () => ({
  updateMany: jest.fn(),
  updateOne: jest.fn(),
}));
jest.mock('../../common/user-favorite-cleanup.service', () => ({
  removeBookmarkFavoriteReferences: jest.fn(),
  removeNoteFavoriteReferences: jest.fn(),
}));

const Bookmark = require('../../model/bookmark');
const Note = require('../../model/note');
const User = require('../../model/user');
const {
  removeBookmarkFavoriteReferences,
  removeNoteFavoriteReferences,
} = require('../../common/user-favorite-cleanup.service');
const PersonalBookmarksService = require('./bookmarks/personal-bookmarks.service');
const PersonalNotesService = require('./notes/personal-notes.service');
const AdminService = require('../admin/admin.service');

const bookmarkIds = ['bookmark-1', 'bookmark-2'];
const mockBookmarkFind = (bookmarks) => {
  const query = Promise.resolve(bookmarks);
  query.select = jest.fn().mockResolvedValue(bookmarks);
  Bookmark.find.mockReturnValue(query);
};

beforeEach(() => {
  jest.clearAllMocks();
  Bookmark.deleteOne.mockResolvedValue({ deletedCount: 1 });
  Bookmark.findOneAndDelete.mockResolvedValue({ _id: bookmarkIds[0] });
  Bookmark.deleteMany.mockResolvedValue({ deletedCount: bookmarkIds.length });
  Note.findOneAndDelete.mockResolvedValue({ _id: 'note-1' });
  User.updateMany.mockResolvedValue({});
  User.updateOne.mockResolvedValue({});
  removeBookmarkFavoriteReferences.mockResolvedValue();
  removeNoteFavoriteReferences.mockResolvedValue();
});

test('cleans favorites after personal bookmark deletion by ID', async () => {
  await PersonalBookmarksService.deleteBookmarkById('owner', bookmarkIds[0]);

  expect(removeBookmarkFavoriteReferences).toHaveBeenCalledWith([
    bookmarkIds[0],
  ]);
});

test('cleans favorites after personal bookmark deletion by location', async () => {
  await PersonalBookmarksService.deleteBookmarkByLocation(
    'owner',
    'https://example.com'
  );

  expect(removeBookmarkFavoriteReferences).toHaveBeenCalledWith([
    bookmarkIds[0],
  ]);
});

test('cleans every deleted personal bookmark from a bulk tag deletion', async () => {
  mockBookmarkFind(bookmarkIds.map((_id) => ({ _id })));

  await PersonalBookmarksService.deletePrivateBookmarksByTag('owner', 'tag');

  expect(removeBookmarkFavoriteReferences).toHaveBeenCalledWith(bookmarkIds);
});

test('cleans favorites after administrative bookmark deletion by ID', async () => {
  await AdminService.deleteBookmarkById(bookmarkIds[0]);

  expect(removeBookmarkFavoriteReferences).toHaveBeenCalledWith([
    bookmarkIds[0],
  ]);
});

test.each([
  ['location', () => AdminService.deleteBookmarksByLocation('https://example.com')],
  ['owner', () => AdminService.deleteBookmarksByUserId('owner')],
])('cleans all matching favorites after administrative bulk deletion by %s', async (
  _filter,
  deleteBookmarks
) => {
  mockBookmarkFind(bookmarkIds.map((_id) => ({ _id })));

  await deleteBookmarks();

  expect(removeBookmarkFavoriteReferences).toHaveBeenCalledWith(bookmarkIds);
});

test('cleans note favorites after personal note deletion', async () => {
  await PersonalNotesService.deleteNoteById('owner', 'note-1');

  expect(removeNoteFavoriteReferences).toHaveBeenCalledWith(['note-1']);
});
