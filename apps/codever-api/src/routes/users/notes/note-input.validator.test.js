const noteInputValidator = require('./note-input.validator');
const {
  NoteValidationErrorMessages,
  NoteValidationRules,
} = require('./note-input.validator');
const ValidationError = require('../../../error/validation.error');

describe('validateNoteInput', () => {
  test.each([
    // Test cases go here as an array of arrays
    // Each inner array represents a set of arguments to pass to the function
    // The last element of the inner array is the expected error message
    [
      123,
      { userId: null, title: 'Test', content: 'This is a test note' },
      NoteValidationErrorMessages.MISSING_USER_ID,
    ],
    [
      456,
      { userId: 789, title: 'Test', content: 'This is a test note' },
      NoteValidationErrorMessages.USER_ID_NOT_MATCHING,
    ],
    [
      111,
      { userId: 111, title: null, content: 'This is a test note' },
      NoteValidationErrorMessages.MISSING_TITLE,
    ],
    [
      222,
      { userId: 222, title: 'Test', content: null },
      NoteValidationErrorMessages.MISSING_CONTENT,
    ],
    [
      333,
      {
        userId: 333,
        title: 'Test',
        content: 'x'.repeat(
          NoteValidationRules.MAX_NUMBER_OF_CHARS_FOR_CONTENT + 1
        ),
      },
      NoteValidationErrorMessages.CONTENT_TOO_LONG,
    ],
  ])(
    'throws a ValidationError with the correct error message',
    (userId, note, expectedErrorMessage) => {
      try {
        expect(() =>
          noteInputValidator.validateNoteInput(userId, note)
        ).toThrowError(ValidationError);
        expect(() =>
          noteInputValidator.validateNoteInput(userId, note)
        ).toThrowError(NoteValidationErrorMessages.NOTE_NOT_VALID);
      } catch (error) {
        // If the function threw an error, test that the error message is correct
        expect(error.validationErrors).toEqual(
          expect.arrayContaining(expectedErrorMessage)
        );
      }
    }
  );

  test('does not throw an error when given valid input', () => {
    const validNote = {
      userId: 123,
      title: 'Test',
      content: 'This is a test note',
    };
    expect(() =>
      noteInputValidator.validateNoteInput(validNote.userId, validNote)
    ).not.toThrowError();
  });

  test('normalizes before counting and accepts thirteen unique tags', () => {
    const tags = Array.from({ length: 13 }, (_, i) => `tag-${i}`);
    const note = { userId: 'u1', title: 'Note', content: 'Markdown', tags: [...tags, ' TAG-0 '] };
    noteInputValidator.validateNoteInput('u1', note);
    expect(note.tags).toEqual(tags);
    expect(NoteValidationRules.MAX_NUMBER_OF_TAGS).toBe(13);
  });

  test.each([
    Array.from({ length: 14 }, (_, i) => `tag-${i}`),
    ['valid', ' '],
    ['valid', 1],
    'tag',
    null,
  ].map((tags) => [tags]))('rejects invalid tags: %j', (tags) => {
    const note = { userId: 'u1', title: 'Note', content: 'Markdown', tags };
    expect(() => noteInputValidator.validateNoteInput('u1', note)).toThrow(ValidationError);
    expect(note.tags).toEqual(tags);
  });

  test('normalizes tags without changing notebook or searchable content', () => {
    const note = {
      userId: 'u1',
      title: 'Notebook',
      contentType: 'notebook',
      notebookContent: '{"cells":[]}',
      content: 'searchable text',
      tags: [' Python ', 'python'],
    };
    noteInputValidator.validateNoteInput('u1', note);
    expect(note).toMatchObject({
      contentType: 'notebook',
      notebookContent: '{"cells":[]}',
      content: 'searchable text',
      tags: ['python'],
    });
  });
});
