const showdown = require('showdown');
const Bookmark = require('../../model/bookmark');
const bookmarkRequestMapper = require('./bookmark-request.mapper');

jest.mock('showdown', () => {
  const makeHtml = jest.fn(() => '<p>This is a test bookmark</p>');
  return {
    Converter: jest.fn().mockImplementation(() => ({ makeHtml })),
  };
});

describe('toBookmark', () => {
  const req = {
    body: {
      _id: '123',
      name: 'Codever',
      location: 'https://www.codever.dev',
      language: 'en',
      description: 'This is a test bookmark',
      tags: ['test'],
      public: true,
      stackoverflowQuestionId: null,
    },
    params: {
      userId: '456',
    },
  };

  beforeEach(() => {
    showdown.Converter.mockClear();
    showdown.Converter().makeHtml.mockClear();
    req.body.descriptionHtml = undefined;
    req.body.youtubeVideoId = undefined;
    req.body.stackoverflowQuestionId = undefined;
  });

  it('should use descriptionHtml if it is provided', () => {
    req.body.descriptionHtml = '<p>This is a test bookmark</p>';

    const expectedBookmark = new Bookmark({
      _id: '123',
      name: 'Codever',
      location: 'https://www.codever.dev',
      language: 'en',
      description: 'This is a test bookmark',
      descriptionHtml: '<p>This is a test bookmark</p>',
      tags: ['test'],
      public: true,
      userId: '456',
      likeCount: 0,
      youtubeVideoId: null,
      stackoverflowQuestionId: null,
    });

    const resultBookmark = bookmarkRequestMapper.toBookmark(req);

    expect({ ...resultBookmark.toObject(), _id: {} }).toEqual({
      ...expectedBookmark.toObject(),
      _id: {},
    });
    expect(showdown.Converter().makeHtml).not.toHaveBeenCalled();
  });

  test.each([
    [
      'should return a new bookmark',
      req,
      new Bookmark({
        _id: 123,
        name: 'Codever',
        location: 'https://www.codever.dev',
        language: 'en',
        description: 'This is a test bookmark',
        descriptionHtml: '<p>This is a test bookmark</p>',
        tags: ['test'],
        public: true,
        userId: '456',
        likeCount: 0,
        youtubeVideoId: null,
        stackoverflowQuestionId: null,
      }),
    ],
    [
      'should set youtubeVideoId if it is provided',
      {
        ...req,
        body: {
          ...req.body,
          youtubeVideoId: 'abcd1234',
        },
      },
      new Bookmark({
        _id: '123',
        name: 'Codever',
        location: 'https://www.codever.dev',
        language: 'en',
        description: 'This is a test bookmark',
        descriptionHtml: '<p>This is a test bookmark</p>',
        tags: ['test'],
        public: true,
        userId: '456',
        likeCount: 0,
        youtubeVideoId: 'abcd1234',
        stackoverflowQuestionId: null,
      }),
    ],
    [
      'should set stackoverflowQuestionId if it is provided',
      {
        ...req,
        body: {
          ...req.body,
          stackoverflowQuestionId: 123456,
        },
      },
      new Bookmark({
        _id: '123',
        name: 'Codever',
        location: 'https://www.codever.dev',
        language: 'en',
        description: 'This is a test bookmark',
        descriptionHtml: '<p>This is a test bookmark</p>',
        tags: ['test'],
        public: true,
        userId: '456',
        likeCount: 0,
        youtubeVideoId: null,
        stackoverflowQuestionId: 123456,
      }),
    ],
  ])('%s', (testname, req, expectedBookmark) => {
    const resultBookmark = bookmarkRequestMapper.toBookmark(req);

    expect({ ...resultBookmark.toObject(), _id: {} }).toEqual({
      ...expectedBookmark.toObject(),
      _id: {},
    });
    expect(showdown.Converter).toHaveBeenCalledTimes(1);
    expect(showdown.Converter().makeHtml).toHaveBeenCalledTimes(1);
    expect(showdown.Converter().makeHtml).toHaveBeenCalledWith(
      'This is a test bookmark'
    );
  });
});
