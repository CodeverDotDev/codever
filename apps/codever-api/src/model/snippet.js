const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/*
 order is imported - used sub-schemas need to be defined before?!
 */
const CodeSnippetSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, select: false },
  code: String,
  language: String,
  comment: String,
  commentAfter: String,
});

const SnippetOriginSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, select: false },
  location: String, // holds either the URL if it might come from web or the filepath if it comes from IDE extensions
  file: String,
  project: String,
  workspace: String,
});

const snippetSchema = new Schema(
  {
    shareableId: { type: String, select: false },
    title: { type: String, required: true },
    type: { type: String, required: true, default: 'snippet' },
    codeSnippets: [CodeSnippetSchema],
    tags: [String],
    userId: { type: String, ref: 'User' },
    userDisplayName: String,
    initiator: { type: String, select: false },
    public: Boolean,
    language: String,
    reference: String,
    lastAccessedAt: { type: Date, select: false },
    likeCount: Number,
    copiedFromId: String,
    ownerVisitCount: { type: Number, select: false },
    origin: SnippetOriginSchema,
    __v: { type: Number, select: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Snippet', snippetSchema);
