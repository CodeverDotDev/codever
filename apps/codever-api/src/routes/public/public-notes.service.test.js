jest.mock('../../model/note', () => ({
  find: jest.fn(),
}));

const Note = require('../../model/note');
const PublicNotesService = require('./public-notes.service');

function mockNoteQuery() {
  const query = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  };
  Note.find.mockReturnValue(query);
  return query;
}

describe('public notes search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sorts tag-only searches by creation date without text-score metadata', async () => {
    const query = mockNoteQuery();

    await PublicNotesService.searchPublicNotes('[git]', 1, 10, 'all');

    expect(Note.find).toHaveBeenCalledWith(
      expect.objectContaining({ tags: { $all: ['git'] } }),
      {}
    );
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it('sorts text searches by MongoDB text score', async () => {
    const query = mockNoteQuery();

    await PublicNotesService.searchPublicNotes('git tutorial', 1, 10, 'all');

    expect(Note.find).toHaveBeenCalledWith(expect.any(Object), {
      score: { $meta: 'textScore' },
    });
    expect(query.sort).toHaveBeenCalledWith({
      score: { $meta: 'textScore' },
    });
  });
});


