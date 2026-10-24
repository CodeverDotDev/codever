const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const shareLinkSchema = new Schema(
  {
    resourceType: {
      type: String,
      enum: ['bookmark', 'note'],
      required: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    ownerUserId: {
      type: String,
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      select: false,
      immutable: true,
    },
    active: {
      type: Boolean,
      default: true,
      required: true,
    },
    revokedAt: Date,
  },
  { timestamps: true }
);

shareLinkSchema.index({ token: 1 }, { unique: true });
shareLinkSchema.index(
  { resourceType: 1, resourceId: 1 },
  {
    unique: true,
    partialFilterExpression: { active: true },
  }
);
shareLinkSchema.index({
  ownerUserId: 1,
  active: 1,
  createdAt: -1,
  _id: -1,
});

module.exports = mongoose.model('ShareLink', shareLinkSchema);
