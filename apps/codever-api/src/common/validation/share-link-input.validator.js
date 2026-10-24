const ValidationError = require('../../error/validation.error');

const RESERVED_SHARE_FIELDS = [
  'shareableId',
  'shareLinkId',
  'shareToken',
  'token',
];

const validateNoShareLinkFields = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return;
  }

  if (RESERVED_SHARE_FIELDS.some((field) => Object.prototype.hasOwnProperty.call(input, field))) {
    throw new ValidationError('Sharing credentials are managed separately');
  }
};

module.exports = { validateNoShareLinkFields };
