const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const noteSchema = new Schema({
    title: {type:String, required: true},
    content: String,
    reference: String,
    tags: [String],
    public: Boolean,
    userId: {type: String, ref:'User'},
    __v: { type: Number, select: false}
},
{
  timestamps: true
});

module.exports = mongoose.model('Note', noteSchema);
