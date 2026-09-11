jest.mock('../../model/bookmark', () => ({
  find: jest.fn(),
}));

const Bookmark = require('../../model/bookmark');
const BookmarksSearchService = require('./bookmarks-search.service');

function mockBookmarkQuery() {
  const query = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  };
  Bookmark.find.mockReturnValue(query);
  return query;
}

describe('bookmark search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('omits text-score projection for tag-only searches', async () => {
    const query = mockBookmarkQuery();

    await BookmarksSearchService.findPublicBookmarks(
      '[git]',
      1,
      10,
      'all',
      'textScore'
    );

    expect(Bookmark.find).toHaveBeenCalledWith(
      expect.objectContaining({ tags: { $all: ['git'] } }),
      {}
    );
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it('projects and sorts by text score for full-text searches', async () => {
    const query = mockBookmarkQuery();

    await BookmarksSearchService.findPublicBookmarks(
      'git tutorial',
      1,
      10,
      'all',
      'textScore'
    );

    expect(Bookmark.find).toHaveBeenCalledWith(expect.any(Object), {
      score: { $meta: 'textScore' },
    });
    expect(query.sort).toHaveBeenCalledWith({
      score: { $meta: 'textScore' },
    });
  });
});

