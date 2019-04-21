const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookmarkSchema = new Schema({
    name: {type:String, required: true},
    location: {type:String, required: true},
    description: String,
    descriptionHtml: String,
    category: {type:String},
    tags: [String],
    publishedOn: Date,
    githubURL: {type:String},
    userId: {type: String, ref:'User'},
    shared: Boolean,
    language: String,
    starredBy: [String],
    lastAccessedAt: Date,
    stars: Number
},
{
  timestamps: true
});

module.exports = mongoose.model('Bookmark', bookmarkSchema);
