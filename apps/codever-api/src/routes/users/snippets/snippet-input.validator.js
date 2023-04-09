const ValidationError = require('../../../error/validation.error');

let validateSnippetInput = function (userId, snippet) {
  let validationErrorMessages = [];

  if (!snippet.userId) {
    validationErrorMessages.push(SnippetValidationMessages.MISSING_USER_ID);
  }

  if (snippet.userId !== userId) {
    validationErrorMessages.push(
      SnippetValidationMessages.USER_ID_NOT_MATCHING
    );
  }

  if (!snippet.title) {
    validationErrorMessages.push(SnippetValidationMessages.MISSING_TITLE);
  }
  if (!snippet.codeSnippets) {
    validationErrorMessages.push(
      SnippetValidationMessages.MISSING_CODE_SNIPPETS
    );
  }
  if (snippet.codeSnippets && snippet.codeSnippets.length > 0) {
    for (let codeSnippet of snippet.codeSnippets) {
      const codeSnippetIsTooLong =
        codeSnippet.code.length >
        SnippetValidationRules.MAX_NUMBER_OF_CHARS_FOR_CODE_SNIPPET;
      if (codeSnippetIsTooLong) {
        validationErrorMessages.push(
          SnippetValidationMessages.CODE_SNIPPET_TOO_LONG
        );
      }

      const codeSnippetHasTooManyLines =
        codeSnippet.code.split('\n').length >
        SnippetValidationRules.MAX_NUMBER_OF_LINES_FOR_CODE_SNIPPET;
      if (codeSnippetHasTooManyLines) {
        validationErrorMessages.push(
          'The code snippet hast too many lines. Max ' +
            SnippetValidationRules.MAX_NUMBER_OF_LINES_FOR_CODE_SNIPPET +
            ' allowed'
        );
      }
    }
  }

  if (!snippet.tags || snippet.tags.length === 0) {
    validationErrorMessages.push('Missing required attribute - tags');
  } else if (snippet.tags.length > SnippetValidationRules.MAX_NUMBER_OF_TAGS) {
    validationErrorMessages.push(
      'Too many tags have been submitted - max allowed 8'
    );
  }

  if (validationErrorMessages.length > 0) {
    throw new ValidationError(
      SnippetValidationMessages.SNIPPET_NOT_VALID,
      validationErrorMessages
    );
  }
};

const SnippetValidationRules = {
  MAX_NUMBER_OF_TAGS: 8,
  MAX_NUMBER_OF_CHARS_FOR_CODE_SNIPPET: 10000,
  MAX_NUMBER_OF_LINES_FOR_CODE_SNIPPET: 1000,
};
const SnippetValidationMessages = {
  SNIPPET_NOT_VALID: 'The snippet you submitted is not valid',
  MISSING_USER_ID: 'Missing required attribute - userId',
  USER_ID_NOT_MATCHING:
    'The userId of the snippet does not match the userId parameter',
  MISSING_TITLE: 'Missing required attribute - title',
  MISSING_CODE_SNIPPETS: 'Missing required attribute - codeSnippets',
  CODE_SNIPPET_TOO_LONG: `The code snippet is too long. Max ${SnippetValidationRules.MAX_NUMBER_OF_CHARS_FOR_CODE_SNIPPET} allowed`,
};

module.exports = {
  validateSnippetInput: validateSnippetInput,
  SnippetValidationMessages: SnippetValidationMessages,
};
