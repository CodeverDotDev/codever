const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookmarkSchema = new Schema({
    name: {type:String, required: true},
    location: {type:String, required: true},
    description: String,
    descriptionHtml: String,
    tags: [String],
    publishedOn: Date,
    sourceCodeURL: {type:String},
    userId: {type: String, ref:'User'},
    public: Boolean,
    language: String,
    lastAccessedAt: {type: Date, select: false},
    likeCount: Number,
    ownerVisitCount: {type:Number, select: false},
    youtubeVideoId: {type:String, required: false},
    stackoverflowQuestionId: {type:String, required: false},
    __v: { type: Number, select: false}
},
{
  timestamps: true
});

module.exports = mongoose.model('Bookmark', bookmarkSchema);
