var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongooseUniqueValidator = require('mongoose-unique-validator');

var bookmarkSchema = new Schema({
    name: {type:String, required: true, unique: true},
    url: {type:String, required: true, unique: true},
    category: {type:String, required: true},
    tags: [String]
});

bookmarkSchema.plugin(mongooseUniqueValidator);

module.exports = mongoose.model('Bookmark', bookmarkSchema);