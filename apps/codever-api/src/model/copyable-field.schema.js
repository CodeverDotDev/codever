const { Schema } = require('mongoose');
const {
  MAX_FIELDS, MAX_LABEL_LENGTH, MAX_VALUE_LENGTH, normalizeCopyableFields,
} = require('../common/validation/copyable-fields');

const schema = new Schema({
  label: { type: String, required: true, maxlength: MAX_LABEL_LENGTH },
  value: { type: String, required: true, maxlength: MAX_VALUE_LENGTH },
}, { _id: false });

module.exports = {
  type: [schema],
  default: undefined,
  set: normalizeCopyableFields,
  validate: {
    validator: (fields) => fields === undefined || fields.length <= MAX_FIELDS,
    message: `At most ${MAX_FIELDS} copyable fields are allowed`,
  },
};
