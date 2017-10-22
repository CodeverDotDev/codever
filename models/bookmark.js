var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongooseUniqueValidator = require('mongoose-unique-validator');

var bookmarkSchema = new Schema({
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
    starredBy: [String]
},
{
  timestamps: true
});

bookmarkSchema.plugin(mongooseUniqueValidator);

module.exports = mongoose.model('Bookmark', bookmarkSchema);
module.exports = mongoose.model('Bookmark', bookmarkSchema);
