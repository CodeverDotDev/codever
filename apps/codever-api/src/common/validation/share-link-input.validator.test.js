const ValidationError = require('../../error/validation.error');
const {
  validateNoShareLinkFields,
} = require('./share-link-input.validator');

describe('validateNoShareLinkFields', () => {
  test.each(['shareableId', 'shareLinkId', 'shareToken', 'token'])(
    'rejects attempts to set or clear %s',
    (field) => {
      expect(() =>
        validateNoShareLinkFields({ [field]: 'caller-controlled' })
      ).toThrow(ValidationError);
      expect(() => validateNoShareLinkFields({ [field]: null })).toThrow(
        ValidationError
      );
      expect(() => validateNoShareLinkFields({ [field]: undefined })).toThrow(
        ValidationError
      );
    }
  );

  test('allows ordinary resource fields', () => {
    expect(() =>
      validateNoShareLinkFields({ title: 'Note', public: false })
    ).not.toThrow();
  });
});
