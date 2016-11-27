var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var bookmarkSchema = new Schema({
    _id: String,
    bookmarks: [{type: Schema.Types.ObjectId, ref:'Bookmark'}]
},
{
  timestamps: true
});

module.exports = mongoose.model('User', bookmarkSchema);
