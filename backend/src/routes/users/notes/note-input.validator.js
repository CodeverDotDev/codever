const ValidationError = require('../../../error/validation.error');

let validateNoteInput = function (userId, note) {

  let validationErrorMessages = [];

  if ( !note.userId ) {
    validationErrorMessages.push(NoteValidationErrorMessages.MISSING_USER_ID);
  }

  if ( note.userId !== userId ) {
    validationErrorMessages.push(NoteValidationErrorMessages.MISSING_USER_ID);
  }

  if ( !note.title ) {
    validationErrorMessages.push(NoteValidationErrorMessages.MISSING_TITLE);
  }

  if ( !note.content ) {
    validationErrorMessages.push(NoteValidationErrorMessages.MISSING_CONTENT);
  }

  if ( note.content ) {
    const descriptionIsTooLong = note.content.length > NoteValidationRules.MAX_NUMBER_OF_CHARS_FOR_CONTENT;
    if ( descriptionIsTooLong ) {
      validationErrorMessages.push(NoteValidationErrorMessages.CONTENT_TOO_LONG);
    }
  }

  if ( validationErrorMessages.length > 0 ) {
    throw new ValidationError(NoteValidationErrorMessages.NOTE_NOT_VALID, validationErrorMessages);
  }
}

const NoteValidationRules = {
  MAX_NUMBER_OF_CHARS_FOR_CONTENT: 10000,
  MAX_NUMBER_OF_TAGS: 8
}

const NoteValidationErrorMessages = {
  NOTE_NOT_VALID: 'The note you submitted is not valid',
  MISSING_USER_ID: 'Missing required attribute - userId',
  USER_ID_NOT_MATCHING: 'The userId of the bookmark does not match the userId parameter',
  MISSING_TITLE: 'Missing required attribute - title',
  MISSING_CONTENT: 'Missing required attribute - content',
  CONTENT_TOO_LONG: `The content is too long. Only ${NoteValidationRules.MAX_NUMBER_OF_CHARS_FOR_CONTENT} allowed`,
}

module.exports = {
  validateNoteInput: validateNoteInput,
  NoteValidationRules: NoteValidationRules,
  NoteValidationErrorMessages: NoteValidationErrorMessages
};
