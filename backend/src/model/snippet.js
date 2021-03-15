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
});

const snippetSchema = new Schema({
    title: {type:String, required: true},
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

