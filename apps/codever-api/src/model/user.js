const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const searchSchema = new Schema(
  {
    text: String,
    lastAccessedAt: Date,
    searchDomain: String,
    count: Number,
    saved: Boolean,
  },
  {
    timestamps: true,
  }
);

const profileSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, select: false },
  imageUrl: String,
  displayName: String,
  summary: String,
  websiteLink: String,
  twitterLink: String,
  githubLink: String,
  linkedinLink: String,
});

const followingSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, select: false },
  users: [String],
  tags: [String],
});

const pinnedEntrySchema = new Schema(
  {
    type: {
      type: String,
      enum: ['bookmark', 'note', 'collection'],
      required: true,
    },
    id: { type: Schema.Types.ObjectId, required: true },
  },
  {
    _id: false,
  }
);

const userSchema = new Schema(
  {
    userId: String, //global userId in the bookmarks context (currently is the Keycloak Id)
    profile: profileSchema,
    searches: [searchSchema],
    recentSearches: [searchSchema],
    readLater: [String],
    likes: [String], //ids of bookmarks liked by user
    watchedTags: [String],
    ignoredTags: [String],
    pinned: [pinnedEntrySchema],
    favorites: [String],
    history: [String],
    following: followingSchema,
    followers: { type: [String], select: false },
    showAllPublicInFeed: Boolean,
    enableLocalStorage: Boolean,
    welcomeAck: Boolean,
    acknowledgedNotifications: [String],
    __v: { type: Number, select: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
