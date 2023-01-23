const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChecklistItemSchema = new Schema({
  _id: {type: Schema.Types.ObjectId, select: false},
  text: String,
  checked: {type: Boolean, required: true, default: false},
});

const noteSchema = new Schema({
    title: {type: String, required: true},
    type: {type: String, required: true, default: 'note'},
    content: String,
    reference: String,
    tags: [String],
    template: {type: String, enum: ['note', 'checklist']},
    userId: {type: String, ref: 'User'},
    checklistItems: [{
      text: {type: String, required: true},
      checked: {type: Boolean, required: true, default: false}
    }],
    __v: {type: Number, select: false}
  },
  {
    timestamps: true
  });

module.exports = mongoose.model('Note', noteSchema);
