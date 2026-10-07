const { normalizeCopyableFields } = require('./copyable-fields');
const ValidationError = require('../../error/validation.error');
const Note = require('../../model/note');
const Bookmark = require('../../model/bookmark');
const mapper = require('../mappers/bookmark-request.mapper');
const { validateNoteInput } = require('../../routes/users/notes/note-input.validator');

describe('copyable fields', () => {
  const pair = { label: 'Command', value: 'npm test' };
  test('preserves omission and explicit clearing', () => {
    expect(normalizeCopyableFields(undefined)).toBeUndefined();
    expect(normalizeCopyableFields([])).toEqual([]);
  });
  test('trims edges, preserves internal whitespace, duplicate labels and order', () => {
    const input = [{ label: ' Command ', value: ' npm  test ' }, pair];
    expect(normalizeCopyableFields(input)).toEqual([
      { label: 'Command', value: 'npm  test' }, pair,
    ]);
    expect(input[0].label).toBe(' Command ');
  });
  test('accepts exact boundaries', () => {
    expect(normalizeCopyableFields(Array.from({ length: 10 }, () => ({
      label: 'l'.repeat(100), value: 'v'.repeat(1000),
    })))).toHaveLength(10);
  });
  test.each([
    null, {}, 'text', [null], [[]], [{}], Array(11).fill(pair),
    [{ label: 1, value: 'text' }], [{ label: 'label', value: false }],
    [{ label: ' ', value: 'text' }], [{ label: 'label', value: '\t' }],
    [{ label: 'l'.repeat(101), value: 'text' }],
    [{ label: 'label', value: 'v'.repeat(1001) }],
    ...['\n', '\r', '\r\n', '\u2028', '\u2029'].map(line => [{ label: 'label', value: `value${line}` }]),
    [{ label: 'label\n', value: 'text' }],
  ].map(fields => [fields]))('rejects malformed fields: %j', (fields) => {
    expect(() => normalizeCopyableFields(fields)).toThrow(ValidationError);
  });
  test('bookmark mapper rejects nonstrings before casting', () => {
    expect(() => mapper.toBookmark({ params: { userId: 'user' }, body: {
      tags: ['test'], copyableFields: [{ label: 'label', value: 123 }],
    } })).toThrow(ValidationError);
  });
  test('note boundary rejects nonstrings before persistence', () => {
    expect(() => validateNoteInput('user', {
      userId: 'user', title: 'title', content: 'text', tags: [],
      copyableFields: [{ label: 'label', value: 123 }],
    })).toThrow(ValidationError);
  });
  describe.each([Note, Bookmark])('%s persistence', (Model) => {
    const base = { title: 'title', name: 'name', location: 'https://example.com' };
    test('old documents omit the field', () => {
      expect(new Model(base).toObject().copyableFields).toBeUndefined();
    });
    test('normalizes, preserves order and copies without IDs or aliasing', () => {
      const fields = [pair, { label: 'Command', value: ' npm build ' }];
      const source = new Model({ ...base, copyableFields: fields });
      const clone = new Model({ ...base, copyableFields: source.toObject().copyableFields });
      clone.copyableFields[0].value = 'changed';
      expect(source.copyableFields[0].value).toBe('npm test');
      expect(source.toObject().copyableFields).toEqual([pair, { label: 'Command', value: 'npm build' }]);
      expect(source.validateSync()).toBeUndefined();
    });
    test.each([
      [{ label: 'label', value: 123 }],
      [{ label: 'label', value: 'v'.repeat(1001) }],
      Array(11).fill(pair),
    ].map(fields => [fields]))('rejects invalid direct model assignments: %j', (fields) => {
      expect(new Model({ ...base, copyableFields: fields }).validateSync()).toBeDefined();
    });
  });
});

