const request = require('superagent');
const Bookmark = require('../../model/bookmark');

const NotFoundError = require('../../error/not-found.error');

let getBookmarkByLocation = async (location) => {
  const bookmark = await Bookmark.findOne({
    'public': true,
    location: location
  }).lean().exec();
  if ( !bookmark ) {
    return [];
  } else {
    return [bookmark];
  }
}

let getLatestBookmarks = async (page, limit) => {

  const bookmarks = await Bookmark.find({'public': true})
    .sort({createdAt: -1})
    .skip((page - 1) * limit)
    .limit(limit)
    .lean().exec();

  return bookmarks;
}

let getBookmarksForTag = async (tag, orderBy, page, limit) => {
  let orderByFilter;
  switch (orderBy) {
    case  'LATEST':
      orderByFilter = {createdAt: -1}
      break;
    case 'LIKE_COUNT':
      orderByFilter = {likeCount: -1}
      break;
    default:
      orderByFilter = {createdAt: -1}
  }
  const bookmarks = await Bookmark.find({
    public: true,
    tags: tag
  })
    .sort(orderByFilter)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
    .exec();

  return bookmarks;

};

/* GET bookmark by id. */
let getBookmarkById = async function (bookmarkId) {
  const bookmark = await Bookmark.findById(bookmarkId);
  if ( !bookmark ) {
    throw new NotFoundError(`Bookmakr data NOT_FOUND for id: ${request.params.userId}`);
  }
  return bookmark;
};

module.exports = {
  getBookmarkByLocation: getBookmarkByLocation,
  getLatestPublicBookmarks: getLatestBookmarks,
  getBookmarksForTag: getBookmarksForTag,
  getBookmarkById: getBookmarkById
};
