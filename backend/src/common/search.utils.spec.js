const searchUtils = require('./search.utils');

describe('splitSearchQuery', () => {
  it('should split search query into terms and tags', () => {
    const query = 'term1 [tag1] term2 [tag2]';
    const expectedResult = {
      terms: ['term1', 'term2'],
      tags: ['tag1', 'tag2']
    };
    expect(searchUtils.splitSearchQuery(query)).toEqual(expectedResult);
  });
});

describe('extractFulltextAndSpecialSearchTerms', () => {
  it('should extract special search terms and filters from searched terms', () => {
    const searchedTerms = [      'lang:en',      'site:github.com',      'private:only',      'term1',      'user:12345678-abcd-1234-abcd-123456789abc'    ];
    const expectedResult = {
      "fulltextSearchTerms": [
        "term1"
      ],
      "specialSearchFilters": {
        "lang": "en",
        "privateOnly": true,
        "site": "github.com",
        "userId": "12345678-abcd-1234-abcd-123456789abc"
      }
    }
    expect(searchUtils.extractFulltextAndSpecialSearchTerms(searchedTerms)).toEqual(expectedResult);
  });
});

describe('includeFulltextSearchTermsInFilter', () => {
  test('returns filter with $text when fulltextSearchTerms is not empty', () => {
    const fulltextSearchTerms = ['test'];
    const filter = {};
    const searchInclude = 'any';
    const expected = {
      ...filter,
      $text: {$search: fulltextSearchTerms.join(' ')}
    };
    expect(searchUtils.includeFulltextSearchTermsInFilter(fulltextSearchTerms, filter, searchInclude)).toEqual(expected);
  });

  test('returns filter without $text when fulltextSearchTerms is empty', () => {
    const fulltextSearchTerms = [];
    const filter = {};
    const searchInclude = 'any';
    expect(searchUtils.includeFulltextSearchTermsInFilter(fulltextSearchTerms, filter, searchInclude)).toBe(undefined);
  });
});

describe('generateFullSearchText', () => {
  it('should generate the correct full search text for given fulltext search terms', () => {
    const fulltextSearchTerms = ['apple', '-banana', 'cherry'];
    const expectedResult = '"apple" -banana "cherry"';

    expect(searchUtils.generateFullSearchText(fulltextSearchTerms)).toBe(expectedResult);
  });
});

