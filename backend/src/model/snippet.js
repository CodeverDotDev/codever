const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/*
 order is imported - used sub-schemas need to be defined before?!
 */
const CodeSnippetSchema = new Schema({
  _id: {type:Schema.Types.ObjectId, select: false},
  code: String,
  language: String,
  comment: String,
  commentAfter: String,
});

const snippetSchema = new Schema({
    shareableId: {type:String, select: false},
    title: {type:String, required: true},
    type: {type:String, required: true, default: 'snippet'},
    codeSnippets: [CodeSnippetSchema],
    tags: [String],
    userId: {type: String, ref:'User'},
    userDisplayName: String,
    public: Boolean,
    language: String,
    sourceUrl: String,
    lastAccessedAt: {type: Date, select: false},
    likeCount: Number,
    copiedFromId: String,
    ownerVisitCount: {type:Number, select: false},
    __v: { type: Number, select: false}
},
{
  timestamps: true
});

module.exports = mongoose.model('Snippet', snippetSchema);

