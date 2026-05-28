const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionItemSchema = new Schema(
  {
    resourceId: { type: Schema.Types.ObjectId, required: true },
    resourceType: {
      type: String,
      enum: ['bookmark', 'note'],
      required: true,
    },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const collectionSchema = new Schema(
  {
    name: { type: String, required: true },
    description: String,
    userId: { type: String, ref: 'User', required: true },
    items: [collectionItemSchema],
    public: { type: Boolean, default: false },
    color: String,
    lastVisitedAt: Date,
    __v: { type: Number, select: false },
  },
  {
    timestamps: true,
  }
);

// Ensure collection names are unique per user
collectionSchema.index({ userId: 1, name: 1 }, { unique: true });

// Supports default sort (most recently updated first) on My Collections page
collectionSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('Collection', collectionSchema);

