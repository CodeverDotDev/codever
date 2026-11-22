const Bookmark = require('../../model/bookmark');
const Note = require('../../model/note');
const User = require('../../model/user');

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOWS = { last24h: 1, last7d: 7, last30d: 30 };
const TOP_LIMIT = 10;

const since = (now, days) => new Date(now.getTime() - days * DAY_MS);

// entries without a `public` flag are private
const PRIVATE = { public: { $ne: true } };

/**
 * Counts per time window. Private bookmarks and notes are only counted,
 * never loaded.
 */
const countWindow = async (from) => {
  const created = { createdAt: { $gte: from } };
  const [users, publicBookmarks, privateBookmarks, publicNotes, privateNotes] =
    await Promise.all([
      User.countDocuments(created),
      Bookmark.countDocuments({ ...created, public: true }),
      Bookmark.countDocuments({ ...created, ...PRIVATE }),
      Note.countDocuments({ ...created, public: true }),
      Note.countDocuments({ ...created, ...PRIVATE }),
    ]);

  return {
    users,
    bookmarks: { public: publicBookmarks, private: privateBookmarks },
    notes: { public: publicNotes, private: privateNotes },
  };
};

const getTopTags = async (from) =>
  Bookmark.aggregate([
    { $match: { public: true, createdAt: { $gte: from } } },
    { $project: { tags: 1 } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $limit: TOP_LIMIT },
    { $project: { _id: 0, tag: '$_id', count: 1 } },
  ]);

const getMostActiveUsers = async (from) => {
  const publicCreated = { public: true, createdAt: { $gte: from } };
  const ranking = await Bookmark.aggregate([
    { $match: publicCreated },
    { $project: { userId: 1 } },
    {
      $unionWith: {
        coll: Note.collection.collectionName,
        pipeline: [{ $match: publicCreated }, { $project: { userId: 1 } }],
      },
    },
    { $group: { _id: '$userId', publicEntries: { $sum: 1 } } },
    { $sort: { publicEntries: -1, _id: 1 } },
    { $limit: TOP_LIMIT },
  ]);

  const owners = ranking.length
    ? await User.find({ userId: { $in: ranking.map((row) => row._id) } })
        .select('userId profile.displayName')
        .lean()
        .exec()
    : [];
  const displayNames = new Map(
    owners.map((owner) => [owner.userId, owner.profile?.displayName])
  );

  return ranking.map((row) => ({
    userId: row._id,
    displayName: displayNames.get(row._id),
    publicEntries: row.publicEntries,
  }));
};

/**
 * Recent platform activity, counted from the time of the request.
 */
const getOverview = async (now = new Date()) => {
  const windowNames = Object.keys(WINDOWS);
  const counts = await Promise.all(
    windowNames.map((name) => countWindow(since(now, WINDOWS[name])))
  );
  const lastWeek = since(now, 7);
  const [topTags, mostActiveUsers] = await Promise.all([
    getTopTags(lastWeek),
    getMostActiveUsers(lastWeek),
  ]);

  return {
    generatedAt: now,
    counts: Object.fromEntries(
      windowNames.map((name, index) => [name, counts[index]])
    ),
    topTags,
    mostActiveUsers,
  };
};

module.exports = {
  getOverview,
};
