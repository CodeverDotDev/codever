var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const searchSchema = new Schema({
  text: String,
  lastAccessedAt: Date
},
{
  timestamps: true
});

var userSchema = new Schema({
    _id: String,
    userId: String, //global userId in the codingmarks context (currently is the Keycloak Id)
    searches: [searchSchema]
},
{
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
