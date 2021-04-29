const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const feedbackSchema = new Schema({
    question: String,
    userResponse: String,
    userId: String,
    userAgent: String
  },
  {
    timestamps: true
  });

module.exports = mongoose.model('Feedback', feedbackSchema);
