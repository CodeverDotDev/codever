const searchUtils = require('./search.utils');
const { toBeEmpty } = require('jest-extended');
expect.extend({ toBeEmpty });

const ValidationError = require('../../../error/validation.error');
const { OrderBy } = require('../constant/orderby.constant');
const { CreatedAt } = require('../constant/createtAt.constant');
const { DocType } = require('../../constants');

describe('parseQueryString', () => {
  test.each([
    ['parsing text [javascript]', ['parsing', 'text'], ['javascript']],
    ['[html] css', ['css'], ['html']],
    ['[html template] css', ['css'], ['html template']],
    ['[html-template] css', ['css'], ['html-template']],
    [
      '[react native]    [javascript]  web',
      ['web'],
      ['react native', 'javascript'],
    ],
    ['  [ruby]   hello world', ['hello', 'world'], ['ruby']],
    ['no tags', ['no', 'tags'], []],
    ['no tags private:only', ['no', 'tags', 'private:only'], []],
    [
      'no tags private:only   site:github.com',
      ['no', 'tags', 'private:only', 'site:github.com'],
      [],
    ],
    [
      'no tags user:12345678-abcd-1234-abcd-123456789abc',
      ['no', 'tags', 'user:12345678-abcd-1234-abcd-123456789abc'],
      [],
    ],
  ])(
    "parses '%s' correctly",
    (queryString, expectedSearchTerms, expectedTags) => {
      const [searchTerms, searchTags] =
        searchUtils.parseQueryString(queryString);
      expect(searchTerms).toEqual(expectedSearchTerms);
      expect(searchTags).toEqual(expectedTags);
    }
  );
});

describe('extractFulltextAndSpecialSearchTerms', () => {
  it('should extract special search terms and filters from searched terms', () => {
    const searchedTerms = [
      'lang:en',
      'site:github.com',
      'private:only',
      'term1',
      'user:12345678-abcd-1234-abcd-123456789abc',
    ];
    const expectedResult = {
      fulltextSearchTerms: ['term1'],
      specialSearchTerms: {
        lang: 'en',
        privateOnly: true,
        site: 'github.com',
        userId: '12345678-abcd-1234-abcd-123456789abc',
      },
    };
    expect(
      searchUtils.extractFulltextAndSpecialSearchTerms(searchedTerms)
    ).toEqual(expectedResult);
  });
});

describe('setFulltextSearchTermsFilter', () => {
  test('returns filter with $text when fulltextSearchTerms is not empty', () => {
    const fulltextSearchTerms = ['test'];
    const filter = {};
    const searchInclude = 'any';
    const expected = {
      ...filter,
      $text: { $search: fulltextSearchTerms.join(' ') },
    };
    expect(
      searchUtils.setFulltextSearchTermsFilter(
        fulltextSearchTerms,
        filter,
        searchInclude
      )
    ).toEqual(expected);
  });

  test('returns filter without $text when fulltextSearchTerms is empty', () => {
    const fulltextSearchTerms = [];
    const filter = {};
    const searchInclude = 'any';
    expect(
      searchUtils.setFulltextSearchTermsFilter(
        fulltextSearchTerms,
        filter,
        searchInclude
      )
    ).toBeEmpty();
  });
});

describe('generateFullSearchText', () => {
  it('should generate the correct full search text for given fulltext search terms', () => {
    const fulltextSearchTerms = ['apple', '-banana', 'cherry'];
    const expectedResult = '"apple" -banana "cherry"';

    expect(searchUtils.generateFullSearchText(fulltextSearchTerms)).toBe(
      expectedResult
    );
  });
});

describe('setSpecialSearchTermsFilter', () => {
  describe('set the filter correctly', () => {
    test.each([
      [
        'should set the userId filter when specialSearchTerms.userId is present and isPublic is true',
        {},
        DocType.SNIPPET,
        { userId: '123' },
        true,
        '123',
        { userId: '123' },
      ],
      [
        'should set the userId filter when specialSearchTerms.userId is present and matches the userId',
        {},
        DocType.SNIPPET,
        { userId: '123' },
        false,
        '123',
        { userId: '123' },
      ],
      [
        'should not set the userId filter when specialSearchTerms.userId is present and does not match the userId',
        {},
        DocType.SNIPPET,
        { userId: '456' },
        false,
        '123',
        {},
      ],
      [
        'should set the public filter to false when specialSearchTerms.privateOnly is present',
        {},
        DocType.SNIPPET,
        { privateOnly: true },
        false,
        '123',
        { public: false },
      ],
      [
        'should set the reference filter when specialSearchTerms.site is present for snippets',
        {},
        DocType.SNIPPET,
        { site: 'example.com' },
        false,
        '123',
        { reference: /example.com/i },
      ],
      [
        'should set the location filter when specialSearchTerms.site is present for bookmarks',
        {},
        DocType.BOOKMARK,
        { site: 'example.com' },
        false,
        '123',
        { location: /example.com/i },
      ],
    ])(
      '%s',
      (
        testName,
        filter,
        docType,
        specialSearchTerms,
        isPublic,
        userId,
        expected
      ) => {
        const result = searchUtils.setSpecialSearchTermsFilter(
          docType,
          isPublic,
          userId,
          specialSearchTerms,
          filter
        );
        expect(result).toEqual(expected);
      }
    );
  });

  it('should throw error when document type not known', () => {
    const filter = {};
    const specialSearchTerms = { site: 'example.com' };
    expect(() =>
      searchUtils.setSpecialSearchTermsFilter(
        'unknown',
        false,
        '123',
        specialSearchTerms,
        filter
      )
    ).toThrow(Error);
  });
});

describe('setPublicOrPersonalFilter', () => {
  it('should set public to true if isPublic is true', () => {
    const filter = {};
    const result = searchUtils.setPublicOrPersonalFilter(true, filter);
    expect(result).toEqual({ public: true });
  });

  it('should set userId if userId is provided', () => {
    const filter = {};
    const result = searchUtils.setPublicOrPersonalFilter(false, filter, '123');
    expect(result).toEqual({ userId: '123' });
  });

  it('should throw a ValidationError if neither isPublic nor userId is provided', () => {
    const filter = {};
    expect(() => searchUtils.setPublicOrPersonalFilter(false, filter)).toThrow(
      ValidationError
    );
  });
});

describe('setTagsToFilter', () => {
  it('should set tags to $all: searchTags if searchTags is not empty', () => {
    const filter = {};
    const searchTags = ['javascript', 'react'];
    const result = searchUtils.setTagsToFilter(searchTags, filter);
    expect(result).toEqual({ tags: { $all: searchTags } });
  });

  it('should return the original filter if searchTags is empty', () => {
    const filter = { userId: '123' };
    const searchTags = [];
    const result = searchUtils.setTagsToFilter(searchTags, filter);
    expect(result).toEqual(filter);
  });
});

describe('getSortByObject', () => {
  test('returns a frozen object with createdAt property set to { createdAt: -1 } when sort is "newest" or fulltextSearchTerms is empty', () => {
    const sortBy = searchUtils.getSortByObject('newest', []);
    expect(Object.isFrozen(sortBy)).toBe(true);
    expect(sortBy).toEqual({ createdAt: CreatedAt.DESCENDING });
  });

  test('returns a frozen object with score property set to {$meta: "textScore"} when sort is not "newest" and fulltextSearchTerms is not empty', () => {
    const sortBy = searchUtils.getSortByObject('oldest', [
      'some',
      'search',
      'terms',
    ]);
    expect(Object.isFrozen(sortBy)).toBe(true);
    expect(sortBy).toEqual({ score: { $meta: OrderBy.TEXT_SCORE } });
  });

  test('returns a frozen object with score property set to { createdAt: -1 } when sort is not "newest" but fulltextSearchTerms is empty', () => {
    const sortBy = searchUtils.getSortByObject('oldest', []);
    expect(Object.isFrozen(sortBy)).toBe(true);
    expect(sortBy).toEqual({ createdAt: CreatedAt.DESCENDING });
  });
});

describe('generateSearchFilterAndSortBy', () => {
  const input = {
    isPublic: false,
    userId: 'user1',
    searchInclude: 'any',
  };

  test.each([
    [
      DocType.SNIPPET,
      {
        ...input,
        query: 'codever testing',
      },
      {
        userId: input.userId,
        $text: { $search: 'codever testing' },
      },
      {
        score: { $meta: OrderBy.TEXT_SCORE },
      },
    ],
    [
      DocType.SNIPPET,
      {
        ...input,
        userId: undefined,
        isPublic: true,
        query: 'codever testing',
      },
      {
        public: true,
        $text: { $search: 'codever testing' },
      },
      {
        score: { $meta: OrderBy.TEXT_SCORE },
      },
    ],
    [
      DocType.SNIPPET,
      {
        ...input,
        searchInclude: undefined,
        query: 'codever testing',
      },
      {
        userId: input.userId,
        $text: { $search: '"codever" "testing"' },
      },
      {
        score: { $meta: OrderBy.TEXT_SCORE },
      },
    ],
    [
      DocType.SNIPPET,
      {
        ...input,
        searchInclude: undefined,
        query: 'codever testing -javascript',
      },
      {
        userId: input.userId,
        $text: { $search: '"codever" "testing" -javascript' },
      },
      {
        score: { $meta: OrderBy.TEXT_SCORE },
      },
    ],
    [
      DocType.SNIPPET,
      {
        ...input,
        query: '[javascript]',
      },
      {
        userId: input.userId,
        tags: {
          $all: ['javascript'],
        },
      },
      {
        createdAt: -1,
      },
    ],
    [
      DocType.SNIPPET,
      {
        ...input,
        query: '[javascript] jest testing',
      },
      {
        userId: input.userId,
        $text: { $search: 'jest testing' },
        tags: {
          $all: ['javascript'],
        },
      },
      {
        score: { $meta: OrderBy.TEXT_SCORE },
      },
    ],
    [
      DocType.SNIPPET,
      {
        ...input,
        query: '[javascript] jest testing site:codever.dev',
      },
      {
        userId: input.userId,
        $text: { $search: 'jest testing' },
        reference: new RegExp('codever.dev', 'i'),
        tags: {
          $all: ['javascript'],
        },
      },
      {
        score: { $meta: OrderBy.TEXT_SCORE },
      },
    ],
    [
      DocType.BOOKMARK,
      {
        ...input,
        query: '[javascript] jest testing site:codever.dev',
      },
      {
        userId: input.userId,
        $text: { $search: 'jest testing' },
        location: new RegExp('codever.dev', 'i'),
        tags: {
          $all: ['javascript'],
        },
      },
      {
        score: { $meta: OrderBy.TEXT_SCORE },
      },
    ],
    [
      DocType.BOOKMARK,
      {
        ...input,
        sort: OrderBy.NEWEST,
        query: '[javascript] jest testing site:codever.dev',
      },
      {
        userId: input.userId,
        $text: { $search: 'jest testing' },
        location: new RegExp('codever.dev', 'i'),
        tags: {
          $all: ['javascript'],
        },
      },
      {
        createdAt: -1,
      },
    ],
    [
      DocType.BOOKMARK,
      {
        ...input,
        query: '[javascript] jest testing site:codever.dev lang:en',
      },
      {
        userId: input.userId,
        $text: { $search: 'jest testing' },
        location: new RegExp('codever.dev', 'i'),
        language: 'en',
        tags: {
          $all: ['javascript'],
        },
      },
      {
        score: { $meta: OrderBy.TEXT_SCORE },
      },
    ],
    [
      DocType.BOOKMARK,
      {
        ...input,
        query: '[javascript] lang:en',
      },
      {
        userId: input.userId,
        language: 'en',
        tags: {
          $all: ['javascript'],
        },
      },
      {
        createdAt: -1,
      },
    ],
  ])(
    'for %p, given input params %p , should generate filter %p and sortBy %p',
    async (docType, input, expectedFilter, expectedSortBy) => {
      const { filter, sortBy } = searchUtils.generateSearchFilterAndSortBy(
        docType,
        input.isPublic,
        input.userId,
        input.query,
        input.searchInclude,
        input.sort
      );
      expect(filter).toEqual(expectedFilter);
      expect(sortBy).toEqual(expectedSortBy);
    }
  );
});
