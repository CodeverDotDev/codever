const queryOf = (result) => ({
  select: () => ({ lean: () => ({ exec: () => Promise.resolve(result) }) }),
});

jest.mock('../../model/bookmark', () => ({
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
}));
jest.mock('../../model/note', () => ({
  countDocuments: jest.fn(),
  find: jest.fn(),
  collection: { collectionName: 'notes' },
}));
jest.mock('../../model/user', () => ({
  countDocuments: jest.fn(),
  find: jest.fn(),
}));

const Bookmark = require('../../model/bookmark');
const Note = require('../../model/note');
const User = require('../../model/user');
const { getOverview } = require('./admin-overview.service');

const NOW = new Date('2026-11-21T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

beforeEach(() => {
  jest.clearAllMocks();
  User.countDocuments.mockResolvedValue(3);
  Bookmark.countDocuments.mockImplementation(async (filter) =>
    filter.public === true ? 2 : 5
  );
  Note.countDocuments.mockImplementation(async (filter) =>
    filter.public === true ? 1 : 4
  );
  Bookmark.aggregate
    .mockResolvedValueOnce([{ tag: 'casino', count: 7 }])
    .mockResolvedValueOnce([{ _id: 'spammer', publicEntries: 40 }]);
  User.find.mockReturnValue(
    queryOf([{ userId: 'spammer', profile: { displayName: 'Spammer' } }])
  );
});

test('counts each window from the request time, public and private apart', async () => {
  const overview = await getOverview(NOW);

  const userWindows = User.countDocuments.mock.calls.map(
    ([filter]) => NOW - filter.createdAt.$gte
  );
  expect(userWindows).toEqual([DAY, 7 * DAY, 30 * DAY]);
  expect(overview.counts.last24h).toEqual({
    users: 3,
    bookmarks: { public: 2, private: 5 },
    notes: { public: 1, private: 4 },
  });
  expect(Object.keys(overview.counts)).toEqual([
    'last24h',
    'last7d',
    'last30d',
  ]);
});

test('counts entries without a public flag as private', async () => {
  await getOverview(NOW);

  const privateFilters = Bookmark.countDocuments.mock.calls
    .map(([filter]) => filter)
    .filter((filter) => filter.public !== true);
  expect(privateFilters).toHaveLength(3);
  privateFilters.forEach((filter) =>
    expect(filter.public).toEqual({ $ne: true })
  );
});

test('top tags and most active users only read public entries of the last 7 days', async () => {
  const overview = await getOverview(NOW);

  const [tagsPipeline] = Bookmark.aggregate.mock.calls[0];
  const [activePipeline] = Bookmark.aggregate.mock.calls[1];
  expect(tagsPipeline[0].$match.public).toBe(true);
  expect(NOW - tagsPipeline[0].$match.createdAt.$gte).toBe(7 * DAY);
  expect(activePipeline[0].$match.public).toBe(true);
  expect(activePipeline[2].$unionWith.pipeline[0].$match.public).toBe(true);

  expect(overview.topTags).toEqual([{ tag: 'casino', count: 7 }]);
  expect(overview.mostActiveUsers).toEqual([
    { userId: 'spammer', displayName: 'Spammer', publicEntries: 40 },
  ]);
});
