var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const searchSchema = new Schema({
  text: String,
  lastAccessedAt: Date,
  searchDomain: String,
  count: Number
},
{
  timestamps: true
});

var userSchema = new Schema({
    userId: String, //global userId in the bookmarks context (currently is the Keycloak Id)
    searches: [searchSchema],
    readLater: [String],
    likes: [String], //ids of bookmarks starred by user
    watchedTags: [String],
    pinned: [String],
    favorites: [String],
    history: [String]
},
{
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
