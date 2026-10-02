jest.mock('../../../model/bookmark', () => ({ findOneAndUpdate: jest.fn() }));
jest.mock('../../../model/user', () => ({}));

const Bookmark = require('../../../model/bookmark');
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

  test.each([
    tags(14), [], undefined, 'tag', ['valid', 1], [''], [' Awesome-js '],
  ].map((input) => [input]))('rejects invalid input before persistence: %j', async (input) => {
    await expect(write(bookmark(input))).rejects.toBeInstanceOf(ValidationError);
    expect(save).not.toHaveBeenCalled();
    expect(Bookmark.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
