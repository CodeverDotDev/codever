const constants = require('../../../common/constants');
const ValidationError = require('../../../error/validation.error');

let validateSnippetInput = function(userId, snippet) {

  let validationErrorMessages = [];

  if (!snippet.userId) {
    validationErrorMessages.push('Missing required attribute - userId');
  }

  if (snippet.userId !== userId) {
    validationErrorMessages.push("The userId of the snippet does not match the userId parameter");
  }

  if (!snippet.title) {
    validationErrorMessages.push('Missing required attribute - name');
  }
  if (!snippet.codeSnippets) {
    validationErrorMessages.push('Missing required attribute - codeSnippets');
  }
  if (snippet.codeSnippets && snippet.codeSnippets.length > 0) {
    for(let codeSnippet of snippet.codeSnippets) {
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

  if (!snippet.tags || snippet.tags.length === 0) {
    validationErrorMessages.push('Missing required attribute - tags');
  } else if (snippet.tags.length > constants.MAX_NUMBER_OF_TAGS) {
    validationErrorMessages.push('Too many tags have been submitted - max allowed 8');
  }

  if(validationErrorMessages.length > 0){
    throw new ValidationError('The snippet you submitted is not valid', validationErrorMessages);
  }
}

module.exports = {
  validateSnippetInput: validateSnippetInput,
};
