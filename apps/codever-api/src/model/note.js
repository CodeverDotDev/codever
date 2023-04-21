const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const noteSchema = new Schema(
  {
    title: { type: String, required: true },
    type: { type: String, required: true, default: 'note' },
    content: String,
    reference: String,
    initiator: {type:String, select: false},
    tags: [String],
    public: Boolean,
    userId: { type: String, ref: 'User' },
    __v: { type: Number, select: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Note', noteSchema);
