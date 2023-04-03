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
});
