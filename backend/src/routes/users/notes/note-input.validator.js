const constants = require('../../../common/constants');
const ValidationError = require('../../../error/validation.error');

let validateNoteInput = function(userId, note) {

  let validationErrorMessages = [];

  if (!note.userId) {
    validationErrorMessages.push('Missing required attribute - userId');
  }

  if (note.userId !== userId) {
    validationErrorMessages.push("The userId of the snippet does not match the userId parameter");
  }

  if (!note.title) {
    validationErrorMessages.push('Missing required attribute - title');
  }

  if(note.template === 'note') {
    if (!note.content) {
      validationErrorMessages.push('Missing required attribute - content');
    }
  }


  if(validationErrorMessages.length > 0){
    throw new ValidationError('The snippet you submitted is not valid', validationErrorMessages);
  }
}

module.exports = {
  validateNoteInput: validateNoteInput,
};
