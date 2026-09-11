const Bookmark = require('../../model/bookmark');
const searchUtils = require('./utils/search.utils');
const { OrderBy } = require('./constant/orderby.constant');
const { DocType } = require('../constants');

let findPublicBookmarks = async function (
  query,
  page,
  limit,
  searchInclude,
  sort
) {
  return findBookmarks(true, null, query, page, limit, searchInclude, sort);
};

let findPersonalBookmarks = async function (
  userId,
  query,
  page,
  limit,
  searchInclude
) {
  return findBookmarks(false, userId, query, page, limit, searchInclude);
};

let findBookmarks = async function (
  isPublic,
  userId,
  query,
  page,
  limit,
  searchInclude,
  sort = 'textScore'
) {
  const { filter, sortBy } = searchUtils.generateSearchFilterAndSortBy(
    DocType.BOOKMARK,
    isPublic,
    userId,
    query,
    searchInclude,
    sort
  );
  // MongoDB only provides textScore metadata when the filter contains $text.
  // Tag-only searches must not request that metadata or MongoDB returns a 503.
  const projection = filter.$text
    ? { score: { $meta: OrderBy.TEXT_SCORE } }
    : {};

  const bookmarks = await Bookmark.find(filter, projection)
    .sort(sortBy)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
    .exec();

  return bookmarks;
};

module.exports = {
  findPublicBookmarks: findPublicBookmarks,
  findPersonalBookmarks: findPersonalBookmarks,
};
