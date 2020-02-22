const Bookmark = require('../../model/bookmark');
const NotFoundError = require('../../error/not-found.error');
const ValidationError = require('../../error/validation.error');

const BookmarkInputValidator = require('../../common/bookmark-input.validator');

/* GET all bookmarks */
let getBookmarksWithFilter = async (isPublic, location, userId) => {
  let filter = {};
  if (isPublic) {
    filter.public = true;
  }
  if (location) {
    filter.location = location;
  }
  if (userId) {
    filter.userId = userId;
  }
  const bookmarks = await Bookmark.find(filter).sort({createdAt: -1}).lean().exec();

  return bookmarks;
};


let getTagsOrderByNumberDesc = async () => {
  const tags = await Bookmark.aggregate(
    [
      {$match: {public: true}},
      {$project: {"tags": 1}},
      {$unwind: "$tags"},
      {$group: {"_id": "$tags", "count": {"$sum": 1}}},
      {$sort: {count: -1}}
    ]
  );

  return tags;
};


/**
 * Returns the bookmarks added recently.
 *
 * The since query parameter is a timestamp which specifies the date since we want to look forward to present time.
 * If this parameter is present it has priority. If it is not present, we might specify the number of days to look back via
 * the query parameter numberOfDays. If not present it defaults to 7 days, last week.
 *
 */
let getLatestBookmarksBetweenDates = async (fromDate, toDate) => {

  if (fromDate > toDate) {
    throw new ValidationError('timing query parameters values', ['<Since> param value must be before <to> parameter value']);
  }
  const bookmarks = await Bookmark.find(
    {
      'public': true,
      createdAt: {
        $gte: fromDate,
        $lte: toDate
      }
    }
  ).sort({createdAt: 'desc'}).lean().exec();

  return bookmarks;
}

let getLatestBookmarksWithDaysBack = async (daysBack) => {

  const bookmarks = await Bookmark.find(
    {
      'public': true,
      createdAt: {$gte: new Date((new Date().getTime() - (daysBack * 24 * 60 * 60 * 1000)))}
    }
  ).sort({createdAt: 'desc'}).lean().exec();

  return bookmarks;
}

/* GET bookmark by id */
let getBookmarkById = async (bookmarkId) => {
  const bookmark = await Bookmark.findOne({
    _id: bookmarkId
  });

  if (!bookmark) {
    throw new NotFoundError(`Bookmark NOT_FOUND with id:${bookmarkId}`);
  } else {
    return bookmark;
  }
};

/**
 * create bookmark
 */
let createBookmark = async (bookmark) => {

  BookmarkInputValidator.validateBookmarkInputForAdmin(bookmark);

  await BookmarkInputValidator.verifyPublicBookmarkExistenceOnCreation(bookmark);

  let newBookmark = await bookmark.save();

  return newBookmark;

};


/**
 * full UPDATE via PUT - that is the whole document is required and will be updated
 * the descriptionHtml parameter is only set in backend, if only does not come front-end (might be an API call)
 */
let updateBookmark = async (bookmark) => {
  BookmarkInputValidator.validateBookmarkInputForAdmin(bookmark);
  await BookmarkInputValidator.verifyPublicBookmarkExistenceOnUpdate(bookmark, bookmark.userId);

  const updatedBookmark = await Bookmark.findOneAndUpdate(
    {
      _id: bookmark._id
    },
    bookmark,
    {new: true}
  );

  const bookmarkNotFound = !updatedBookmark;
  if (bookmarkNotFound) {
    throw new NotFoundError('Bookmark with the id ' + bookmark._id + ' not found');
  } else {
    return updatedBookmark;
  }
};

/*
* DELETE bookmark for by bookmarkId
*/
let deleteBookmarkById = async (bookmarkId) => {
  const bookmark = await Bookmark.findOneAndRemove({
    _id: bookmarkId
  });

  if (!bookmark) {
    throw new NotFoundError(`Bookmark NOT_FOUND with id: ${bookmarkId}`);
  } else {
    return true;
  }
};

/*
* DELETE bookmarks with location
*/
let deleteBookmarksByLocation = async (location) => {
  await Bookmark.deleteMany({location: location});

  return true;
};

/**
 * Delete bookmarks of a user, identified by userId
 */
let deleteBookmarksByUserId = async (userId) => {
    await Bookmark.deleteMany({userId: userId});
    return true;
};

module.exports = {
  getBookmarksWithFilter: getBookmarksWithFilter,
  getTagsOrderByNumberDesc: getTagsOrderByNumberDesc,
  getLatestBookmarksBetweenDates: getLatestBookmarksBetweenDates,
  getLatestBookmarksWithDaysBack: getLatestBookmarksWithDaysBack,
  getBookmarkById: getBookmarkById,
  createBookmark: createBookmark,
  updateBookmark: updateBookmark,
  deleteBookmarkById: deleteBookmarkById,
  deleteBookmarksByLocation: deleteBookmarksByLocation,
  deleteBookmarksByUserId: deleteBookmarksByUserId
};
