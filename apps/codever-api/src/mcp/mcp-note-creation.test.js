const { updateNoteSchema } = require('./mcp-note-creation');
const { NoteValidationRules } = require('../routes/users/notes/note-input.validator');

const MAX_CONTENT = NoteValidationRules.MAX_NUMBER_OF_CHARS_FOR_CONTENT;

describe('updateNoteSchema', () => {
  test.each([
    {},
    { id: 'n1' },
    { id: 'n1', unknown: true },
    { id: 'n1', title: '' },
    { id: 'n1', title: ' ' },
    { id: 'n1', content: '' },
    { id: 'n1', content: ' ' },
    { id: 'n1', content: 'x'.repeat(MAX_CONTENT + 1) },
    { id: 'n1', tags: 'tag' },
    { id: 'n1', tags: ['tag', 1] },
  ])('rejects invalid patch %#', (input) => {
    expect(() => updateNoteSchema.parse(input)).toThrow();
  });

  test('accepts a strict patch with any editable field', () => {
    expect(updateNoteSchema.parse({ id: ' n1 ', title: 'Updated', public: false })).toEqual({
      id: ' n1 ', title: 'Updated', public: false,
    });
  });

  test('accepts the maximum content length', () => {
    expect(MAX_CONTENT).toBe(100000);
    expect(updateNoteSchema.parse({ id: 'n1', content: 'x'.repeat(MAX_CONTENT) }).content).toHaveLength(MAX_CONTENT);
  });
});

