const constants = require('../../../common/constants');
const ValidationError = require('../../../error/validation.error');

let validateCodeletInput = function(userId, codelet) {

  let validationErrorMessages = [];

  if (!codelet.userId) {
    validationErrorMessages.push('Missing required attribute - userId');
  }

  if (codelet.userId !== userId) {
    validationErrorMessages.push("The userId of the codelet does not match the userId parameter");
  }

  if (!codelet.title) {
    validationErrorMessages.push('Missing required attribute - name');
  }
  if (!codelet.codeSnippets) {
    validationErrorMessages.push('Missing required attribute - codeSnippets');
  }
  if (codelet.codeSnippets && codelet.codeSnippets.length > 0) {
    for(let codeSnippet of codelet.codeSnippets) {
      const descriptionIsTooLong = codeSnippet.code.length > constants.MAX_NUMBER_OF_CHARS_FOR_CODE_SNIPPET;
      if (descriptionIsTooLong) {
        validationErrorMessages.push('The code snippet is too long. Max ' + constants.MAX_NUMBER_OF_CHARS_FOR_CODE_SNIPPET + ' allowed');
      }

      const descriptionHasTooManyLines = codeSnippet.code.split('\n').length > constants.MAX_NUMBER_OF_LINES_FOR_CODE_SNIPPET;
      if (descriptionHasTooManyLines) {
        validationErrorMessages.push('The code snippet hast too many lines. Max ' + constants.MAX_NUMBER_OF_LINES_FOR_CODE_SNIPPET + ' allowed');
      }
    }
  }

  if (!codelet.tags || codelet.tags.length === 0) {
    validationErrorMessages.push('Missing required attribute - tags');
  } else if (codelet.tags.length > constants.MAX_NUMBER_OF_TAGS) {
    validationErrorMessages.push('Too many tags have been submitted - max allowed 8');
  }

  if(validationErrorMessages.length > 0){
    throw new ValidationError('The codelet you submitted is not valid', validationErrorMessages);
  }
}

module.exports = {
  validateCodeletInput: validateCodeletInput,
};
