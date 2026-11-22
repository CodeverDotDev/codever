const Bookmark = require('../../model/bookmark');
const Note = require('../../model/note');
const User = require('../../model/user');
const ValidationError = require('../../error/validation.error');

const searchUtils = require('../../common/searching/utils/search.utils');
const { DocType } = require('../../common/constants');
const { OrderBy } = require('../../common/searching/constant/orderby.constant');

const TYPES = ['all', 'bookmark', 'note'];

/**
 * Builds the query for one collection. Whatever the search text contains
 * (e.g. a `user:` term), the filter always ends with `public: true`.
 */
const buildQuery = (docType, q, userId) => {
  let filter = {};
  let sortBy = { createdAt: -1 };
  if (q) {
    const generated = searchUtils.generateSearchFilterAndSortBy(
      docType,
      true,
      null,
      q,
      'all',
      OrderBy.TEXT_SCORE
    );
    filter = { ...generated.filter };
    sortBy = generated.sortBy;
  }
  if (userId) {
    filter.userId = userId;
  }
  filter.public = true;

  const projection = filter.$text ? { score: { $meta: 'textScore' } } : {};
  return { filter, sortBy, projection };
};

const findPublic = async (Model, docType, q, userId, count) => {
  const { filter, sortBy, projection } = buildQuery(docType, q, userId);
  return Model.find(filter, projection)
    .sort(sortBy)
    .limit(count)
    .lean()
    .exec();
};

const byScoreOrNewest = (a, b) => {
  if (a.score !== undefined && b.score !== undefined && a.score !== b.score) {
    return b.score - a.score;
  }
  return new Date(b.createdAt) - new Date(a.createdAt);
};

const toResult = (type, entry, displayNames) => ({
  type,
  id: String(entry._id),
  title: type === 'bookmark' ? entry.name : entry.title,
  location: type === 'bookmark' ? entry.location : undefined,
  tags: entry.tags || [],
  ownerId: entry.userId,
  ownerDisplayName:
    displayNames.get(entry.userId) || entry.userDisplayName || undefined,
  createdAt: entry.createdAt,
  score: entry.score,
});

/**
 * Lists public bookmarks and notes of all users: newest first, or best
 * matches first when a search text is given.
 */
const getPublicEntries = async ({ q, type = 'all', userId, page, limit }) => {
  const entryType = type || 'all';
  if (!TYPES.includes(entryType)) {
    throw new ValidationError('Invalid type filter', [
      'type must be one of: all, bookmark, note',
    ]);
  }

  // read enough of each collection to merge the requested page correctly
  const needed = page * limit;
  const [bookmarks, notes] = await Promise.all([
    entryType === 'note'
      ? []
      : findPublic(Bookmark, DocType.BOOKMARK, q, userId, needed),
    entryType === 'bookmark'
      ? []
      : findPublic(Note, DocType.NOTE, q, userId, needed),
  ]);

  const merged = [
    ...bookmarks.map((entry) => ({ type: 'bookmark', entry })),
    ...notes.map((entry) => ({ type: 'note', entry })),
  ]
    .sort((a, b) => byScoreOrNewest(a.entry, b.entry))
    .slice((page - 1) * limit, page * limit);

  const ownerIds = [...new Set(merged.map(({ entry }) => entry.userId))];
  const owners = ownerIds.length
    ? await User.find({ userId: { $in: ownerIds } })
        .select('userId profile.displayName')
        .lean()
        .exec()
    : [];
  const displayNames = new Map(
    owners.map((owner) => [owner.userId, owner.profile?.displayName])
  );

  return merged.map(({ type: entryTypeOf, entry }) =>
    toResult(entryTypeOf, entry, displayNames)
  );
};

module.exports = {
  getPublicEntries,
};
