const snippetInputValidator = require('./snippet-input.validator')
const ValidationError = require("../../../error/validation.error");
const {SnippetValidationMessages} = require("./snippet-input.validator");

describe('validateSnippetInput', () => {
  test.each([
    // Missing userId
    [1, {title: 'My Snippet', codeSnippets: [{code: 'console.log("Hello, world!");'}], tags: ['javascript']}, [SnippetValidationMessages.MISSING_USER_ID]],
    // Mismatched userId
    [1, {userId: 2, title: 'My Snippet', codeSnippets: [{code: 'console.log("Hello, world!");'}], tags: ['javascript']}, [SnippetValidationMessages.USER_ID_NOT_MATCHING]],
    // Missing title
    [1, {userId: 1, codeSnippets: [{code: 'console.log("Hello, world!");'}], tags: ['javascript']}, [SnippetValidationMessages.MISSING_TITLE]],
    // Missing codeSnippets
    [1, {userId: 1, title: 'My Snippet', tags: ['javascript']}, ['Missing required attribute - codeSnippets']],
    // Code snippet with too many characters
    [1, {userId: 1, title: 'My Snippet', codeSnippets: [{code: 'a'.repeat(10001)}], tags: ['javascript']}, ['The code snippet is too long. Max 10000 allowed']],
    // Code snippet with too many lines
    //[1, {userId: 1, title: 'My Snippet', codeSnippets: [{code: 'a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk\nl\nm\nn\no\np\nq\nr\ns\nt\nu\nv\nw\nx\ny\nz'}], tags: ['javascript']}, ['The code snippet hast too many lines. Max 20 allowed']],
    // Missing tags
    [1, {userId: 1, title: 'My Snippet', codeSnippets: [{code: 'console.log("Hello, world!");'}]}, ['Missing required attribute - tags']],
    // Too many tags
    [1, {userId: 1, title: 'My Snippet', codeSnippets: [{code: 'console.log("Hello, world!");'}], tags: ['javascript', 'node', 'express', 'react', 'css', 'html', 'mongodb', 'mysql', 'typescript']}, ['Too many tags have been submitted - max allowed 8']]
  ])('should validate snippet input', (userId, snippet, expectedError) => {
    expect(() => snippetInputValidator.validateSnippetInput(userId, snippet)).toThrowError(ValidationError);
    expect(() => snippetInputValidator.validateSnippetInput(userId, snippet)).toThrow(SnippetValidationMessages.SNIPPET_NOT_VALID);
    try {
      snippetInputValidator.validateSnippetInput(userId, snippet);
      // If the function did not throw an error, fail the test
      expect(true).toBe(false);
    } catch (error) {
      // If the function threw an error, test that the error message is correct
      expect(error.validationErrors).toEqual(expect.arrayContaining(expectedError));
    }
  });
});
