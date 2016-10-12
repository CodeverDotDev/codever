var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongooseUniqueValidator = require('mongoose-unique-validator');

var bookmarkSchema = new Schema({
    name: {type:String, required: true, unique: true},
    location: {type:String, required: true, unique: true},
    description: String,
    category: {type:String, required: true},
    tags: [String]
},
{
  timestamps: true
});

bookmarkSchema.plugin(mongooseUniqueValidator);

module.exports = mongoose.model('Bookmark', bookmarkSchema);
