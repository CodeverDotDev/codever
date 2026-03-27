const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const noteSchema = new Schema(
  {
    title: { type: String, required: true },
    type: { type: String, required: true, default: 'note' },
    content: String,
    // 'markdown' (default) or 'notebook' — determines how content is rendered
    contentType: { type: String, default: 'markdown' },
    // Raw .ipynb JSON stored here for notebook notes; not included in the text search index
    notebookContent: { type: String, select: true },
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
