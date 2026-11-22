const findQuery = (result) => {
  const query = {
    sort: jest.fn(() => query),
    limit: jest.fn(() => query),
    lean: jest.fn(() => query),
    exec: jest.fn(() => Promise.resolve(result)),
  };
  return query;
};

jest.mock('../../model/bookmark', () => ({ find: jest.fn() }));
jest.mock('../../model/note', () => ({ find: jest.fn() }));
jest.mock('../../model/user', () => ({ find: jest.fn() }));

const Bookmark = require('../../model/bookmark');
const Note = require('../../model/note');
const User = require('../../model/user');
const ValidationError = require('../../error/validation.error');
const { getPublicEntries } = require('./admin-public-entries.service');

const bookmark = (id, createdAt, extra = {}) => ({
  _id: id,
  name: `Bookmark ${id}`,
  location: `https://${id}`,
  tags: ['t'],
  userId: 'u1',
  createdAt: new Date(createdAt),
  ...extra,
});
const note = (id, createdAt, extra = {}) => ({
  _id: id,
  title: `Note ${id}`,
  tags: [],
  userId: 'u2',
  createdAt: new Date(createdAt),
  ...extra,
});

beforeEach(() => {
  jest.clearAllMocks();
  User.find.mockReturnValue({
    select: () => ({
      lean: () => ({
        exec: () =>
          Promise.resolve([
            { userId: 'u1', profile: { displayName: 'One' } },
            { userId: 'u2', profile: { displayName: 'Two' } },
          ]),
      }),
    }),
  });
});

test('lists public bookmarks and notes newest first with owner names', async () => {
  Bookmark.find.mockReturnValue(findQuery([bookmark('b1', '2026-11-20')]));
  Note.find.mockReturnValue(findQuery([note('n1', '2026-11-21')]));

  const entries = await getPublicEntries({ page: 1, limit: 10 });

  expect(Bookmark.find.mock.calls[0][0]).toEqual({ public: true });
  expect(Note.find.mock.calls[0][0]).toEqual({ public: true });
  expect(entries).toEqual([
    expect.objectContaining({
      type: 'note',
      id: 'n1',
      title: 'Note n1',
      location: undefined,
      ownerDisplayName: 'Two',
    }),
    expect.objectContaining({
      type: 'bookmark',
      id: 'b1',
      title: 'Bookmark b1',
      location: 'https://b1',
      tags: ['t'],
      ownerId: 'u1',
      ownerDisplayName: 'One',
    }),
  ]);
});

test('searches with text and keeps the public filter even for a user: term', async () => {
  Bookmark.find.mockReturnValue(
    findQuery([bookmark('b1', '2026-11-20', { score: 1 })])
  );
  Note.find.mockReturnValue(findQuery([note('n1', '2026-11-21', { score: 2 })]));

  const entries = await getPublicEntries({
    q: 'casino user:someone',
    page: 1,
    limit: 10,
  });

  const [bookmarkFilter, projection] = Bookmark.find.mock.calls[0];
  expect(bookmarkFilter.public).toBe(true);
  expect(bookmarkFilter.$text).toBeDefined();
  expect(projection).toEqual({ score: { $meta: 'textScore' } });
  expect(entries.map((entry) => entry.id)).toEqual(['n1', 'b1']);
});

test('filters by owner and type', async () => {
  Note.find.mockReturnValue(findQuery([]));

  await getPublicEntries({ type: 'note', userId: 'u2', page: 1, limit: 10 });

  expect(Bookmark.find).not.toHaveBeenCalled();
  expect(Note.find.mock.calls[0][0]).toEqual({ userId: 'u2', public: true });
});

test('merges pages across both collections', async () => {
  Bookmark.find.mockReturnValue(
    findQuery([bookmark('b1', '2026-11-04'), bookmark('b2', '2026-11-02')])
  );
  Note.find.mockReturnValue(
    findQuery([note('n1', '2026-11-03'), note('n2', '2026-11-01')])
  );

  const entries = await getPublicEntries({ page: 2, limit: 2 });

  expect(Bookmark.find.mock.results[0].value.limit).toHaveBeenCalledWith(4);
  expect(entries.map((entry) => entry.id)).toEqual(['b2', 'n2']);
});

test('rejects an unknown type', async () => {
  await expect(
    getPublicEntries({ type: 'snippet', page: 1, limit: 10 })
  ).rejects.toBeInstanceOf(ValidationError);
});
