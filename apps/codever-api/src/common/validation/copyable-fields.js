const ValidationError = require('../../error/validation.error');

const MAX_FIELDS = 10;
const MAX_LABEL_LENGTH = 100;
const MAX_VALUE_LENGTH = 1000;
const LINE_BREAK = /[\r\n\u2028\u2029]/;

function normalizeCopyableFields(fields) {
  // Omission preserves existing data on updates from older clients; [] clears it.
  if (fields === undefined) return undefined;
  const fail = (message) => {
    throw new ValidationError('Copyable fields are not valid', [message]);
  };
  if (!Array.isArray(fields) || fields.length > MAX_FIELDS) {
    fail(`Copyable fields must be an array of at most ${MAX_FIELDS} fields`);
  }
  return fields.map((field, index) => {
    if (!field || typeof field !== 'object' || Array.isArray(field)) {
      fail(`Copyable field ${index + 1} must contain a label and value`);
    }
    const result = {};
    for (const [key, limit] of [['label', MAX_LABEL_LENGTH], ['value', MAX_VALUE_LENGTH]]) {
      const value = field[key];
      if (typeof value !== 'string' || LINE_BREAK.test(value) ||
          !value.trim() || value.trim().length > limit) {
        fail(`Copyable field ${index + 1}: ${key} must be nonempty single-line text of at most ${limit} characters`);
      }
      result[key] = value.trim();
    }
    return result;
  });
}

module.exports = { MAX_FIELDS, MAX_LABEL_LENGTH, MAX_VALUE_LENGTH, normalizeCopyableFields };
