const bookmarkInputValidator = require('./bookmark-input.validator');
const ValidationError = require('../../error/validation.error');
const {
  BookmarkValidationErrorMessages,
  BookmarkValidationRules,
} = require('./bookmark-input.validator');

describe('validateBookmarkInput', () => {
  test.each([
    // Missing userId
    [
      'should fail trying to validate bookmark without an userId',
      1,
      {
        name: 'My Bookmark',
        location: 'https://www.codever.dev',
        tags: ['productivity'],
      },
      [BookmarkValidationErrorMessages.MISSING_USER_ID],
    ],
    // Mismatched userId
    [
      'should fail trying to validate bookmark with a mismatching userId',
      1,
      {
        userId: 2,
        name: 'My Bookmark',
        location: 'https://www.codever.dev',
        tags: ['productivity'],
      },
      [BookmarkValidationErrorMessages.USER_ID_NOT_MATCHING],
    ],
    // Missing title
    [
      'should fail trying to validate bookmark without a title',
      1,
      { userId: 1, tags: ['productivity'] },
      [BookmarkValidationErrorMessages.MISSING_TITLE],
    ],
    // Missing location
    [
      'should fail trying to validate bookmark without a location',
      1,
      { userId: 1, tags: ['productivity'] },
      [BookmarkValidationErrorMessages.MISSING_LOCATION],
    ],
    // Description with too many characters
    [
      'should fail trying to validate bookmark with description with too many characters',
      1,
      {
        userId: 1,
        title: 'Codever',
        description: 'a'.repeat(
          BookmarkValidationRules.MAX_NUMBER_OF_CHARS_FOR_DESCRIPTION + 1
        ),
        tags: ['javascript'],
      },
      [BookmarkValidationErrorMessages.DESCRIPTION_TOO_LONG],
    ],
    // Description with too many lines
    [
      'should fail trying to validate bookmark with description with too many lines',
      1,
      {
        userId: 1,
        name: 'My Bookmark',
        location: 'https://www.codever.dev',
        tags: ['productivity'],
        description: 'a\n'.repeat(
          BookmarkValidationRules.MAX_NUMBER_OF_LINES_FOR_DESCRIPTION + 1
        ),
      },
      [BookmarkValidationErrorMessages.DESCRIPTION_TOO_MANY_LINES],
    ],
    // Missing tags
    [
      'should fail trying to validate bookmark without tags',
      1,
      { userId: 1, name: 'Codever', location: 'https://www.codever.dev' },
      [BookmarkValidationErrorMessages.MISSING_TAGS],
    ],
    // Too many tags
    [
      'should fail trying to validate bookmark with too many',
      1,
      {
        userId: 1,
        name: 'Codever',
        location: 'https://www.codever.dev',
        tags: [
          'productivity',
          'dev-tools',
          'express',
          'react',
          'css',
          'html',
          'mongodb',
          'mysql',
          'typescript',
          'node',
          'testing',
          'api',
          'web',
          'docker',
        ],
      },
      [BookmarkValidationErrorMessages.TOO_MANY_TAGS],
    ],
  ])('%s', (testName, userId, bookmark, expectedError) => {
    expect(() =>
      bookmarkInputValidator.validateBookmarkInput(userId, bookmark)
    ).toThrowError(ValidationError);
    expect(() =>
      bookmarkInputValidator.validateBookmarkInput(userId, bookmark)
    ).toThrow(BookmarkValidationErrorMessages.BOOKMARK_NOT_VALID);
    try {
      bookmarkInputValidator.validateBookmarkInput(userId, bookmark);
      // If the function did not throw an error, fail the test
      expect(true).toBe(false);
    } catch (error) {
      // If the function threw an error, test that the error message is correct
      expect(error.validationErrors).toEqual(
        expect.arrayContaining(expectedError)
      );
    }
  });
});

describe.each(['personal', 'admin'])('%s bookmark tag policy', (boundary) => {
  const validate = (bookmark) => boundary === 'personal'
    ? bookmarkInputValidator.validateBookmarkInput('owner', bookmark)
    : bookmarkInputValidator.validateBookmarkInputForAdmin(bookmark);
  const validBookmark = (tags) => ({
    userId: 'owner', name: 'Bookmark', location: 'https://example.com', tags,
  });

  test('accepts thirteen normalized tags after deduplication', () => {
    const tags = Array.from({ length: 13 }, (_, i) => `tag-${i}`);
    const bookmark = validBookmark([...tags, ' TAG-0 ']);
    validate(bookmark);
    expect(bookmark.tags).toEqual(tags);
    expect(BookmarkValidationRules.MAX_NUMBER_OF_TAGS).toBe(13);
  });

  test.each([
    Array.from({ length: 14 }, (_, i) => `tag-${i}`),
    [], undefined, null, 'tag', [''], ['valid', 1], [' Awesome-list '],
  ].map((tags) => [tags]))('rejects invalid tags: %j', (tags) => {
    expect(() => validate(validBookmark(tags))).toThrow(ValidationError);
  });
});

