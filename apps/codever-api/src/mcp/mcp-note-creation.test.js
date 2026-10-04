const { updateNoteSchema } = require('./mcp-note-creation');

describe('updateNoteSchema', () => {
  test.each([
    {},
    { id: 'n1' },
    { id: 'n1', unknown: true },
    { id: 'n1', title: '' },
    { id: 'n1', title: ' ' },
    { id: 'n1', content: '' },
    { id: 'n1', content: ' ' },
    { id: 'n1', content: 'x'.repeat(30001) },
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
    expect(updateNoteSchema.parse({ id: 'n1', content: 'x'.repeat(30000) }).content).toHaveLength(30000);
  });
});

