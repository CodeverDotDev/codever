var request = require('superagent');
var cheerio = require('cheerio');
var Bookmark = require('../../model/bookmark');

const NotFoundError = require('../../error/not-found.error');
const MAX_NUMBER_RETURNED_RESULTS = 100;

let getBookmarkByLocation = async (location) => {
  const bookmark = await Bookmark.findOne({
    'public': true,
    location: location
  }).lean().exec();
  if (!bookmark) {
    return [];
  } else {
    return [bookmark];
  }
}

let getLatestBookmarks = async () => {
  const bookmarks = await Bookmark.find({'public': true})
    .sort({createdAt: -1})
    .limit(MAX_NUMBER_RETURNED_RESULTS)
    .lean().exec();

  return bookmarks;
}

let getBookmarksForTag = async (tag, orderByFilter) => {
  const bookmarks = await Bookmark.find({
    public: true,
    tags: tag
  })
    .sort(orderByFilter)
    .limit(MAX_NUMBER_RETURNED_RESULTS)
    .lean()
    .exec();

  return bookmarks;

};


/* GET bookmark by id. */
let getBookmarkById = async function (bookmarkId) {
  const bookmark = await Bookmark.findById(bookmarkId);
  if (!bookmark) {
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
