const ValidationError = require('../../error/validation.error');
const {
  MAX_TAGS,
  RECOMMENDED_AI_TAGS,
  normalizeTags,
  TOO_MANY_TAGS,
} = require('./tag-policy');

const tags = (count) => Array.from({ length: count }, (_, i) => `tag-${i}`);

describe('tag policy', () => {
  test('keeps the hard ceiling separate from AI guidance', () => {
    expect(MAX_TAGS).toBe(13);
    expect(RECOMMENDED_AI_TAGS).toBe(8);
  });

  test('trims, lowercases, and deduplicates in first-seen order without mutation', () => {
    const input = [' JavaScript ', 'api', 'javascript', ' API ', 'testing'];
    expect(normalizeTags(input)).toEqual(['javascript', 'api', 'testing']);
    expect(input).toEqual([' JavaScript ', 'api', 'javascript', ' API ', 'testing']);
  });

  test('allows omitted and empty optional tags', () => {
    expect(normalizeTags()).toEqual([]);
    expect(normalizeTags([])).toEqual([]);
  });

  test.each([8, 9, 13])('accepts %i unique tags without truncation', (count) => {
    expect(normalizeTags(tags(count))).toEqual(tags(count));
  });

  test('counts normalized unique tags, not raw inputs', () => {
    expect(normalizeTags([...tags(13), ' TAG-0 ', 'tag-12'])).toEqual(tags(13));
  });

  test('rejects fourteen unique tags with an actionable ValidationError', () => {
    let validationError;
    try {
      normalizeTags(tags(14));
    } catch (error) {
      validationError = error;
    }
    expect(validationError).toBeInstanceOf(ValidationError);
    expect(validationError.validationErrors).toEqual([TOO_MANY_TAGS]);
    expect(TOO_MANY_TAGS).toContain('13');
  });

  test.each([
    null,
    'javascript',
    13,
    {},
    [''],
    ['  '],
    ['valid', null],
    ['valid', 1],
    ['valid', {}],
    ['valid', ['nested']],
  ].map((input) => [input]))('rejects malformed tags: %j', (input) => {
    expect(() => normalizeTags(input)).toThrow(ValidationError);
  });
});

