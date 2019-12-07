const Bookmark = require('../../../model/bookmark');
const User = require('../../../model/user');

const NotFoundError = require('../../../error/not-found.error');

const BookmarkInputValidator = require('../../../common/bookmark-input.validator');

/**
 * CREATE bookmark for user
 */
let createBookmark = async function (userId, bookmark) {
  BookmarkInputValidator.validateBookmarkInput(userId, bookmark);

  await BookmarkInputValidator.verifyPublicBookmarkExistenceOnCreation(bookmark);

  let newBookmark = await bookmark.save();

  return newBookmark;
}

/* GET tags used by user */
let getTagsForUser = async (userId) => {

  const tags = await Bookmark.distinct("tags",
    {
      $or: [
        {userId: userId},
        {shared: true}
      ]
    }); // sort does not work with distinct in mongoose - https://mongoosejs.com/docs/api.html#query_Query-sort

  return tags;
};


/* GET bookmark of user by bookmarkId */
let getBookmarkById = async (userId, bookmarkId) => {

  const bookmark = await Bookmark.findOne({
    _id: bookmarkId,
    userId: userId
  });

  if (!bookmark) {
    throw new NotFoundError(`Bookmark NOT_FOUND the userId: ${userId} AND id: ${bookmarkId}`);
  } else {
    return bookmark;
  }
};

/* GET bookmark of user by location*/
let getBookmarkByLocation = async (userId, location) => {

  const bookmark = await Bookmark.findOne({
    userId: userId,
    location: location
  }).lean().exec();

  if (!bookmark) {
    throw new NotFoundError(`Bookmark NOT_FOUND the userId: ${userId} AND location: ${location}`);
  } else {
    return bookmark;
  }
};

/* GET bookmark of user by location - currently there is a limit set to 100 */
let getLatestBookmarks = async (userId) => {
  const bookmarks = await Bookmark.find({userId: userId})
    .sort({lastAccessedAt: -1})
    .limit(100);

  return bookmarks;
};

/**
 * full UPDATE via PUT - that is the whole document is required and will be updated
 * the descriptionHtml parameter is only set in backend, if only does not come front-end (might be an API call)
 */
let updateBookmark = async (userId, bookmarkId, bookmark) => {

  BookmarkInputValidator.validateBookmarkInput(userId, bookmark);

  await BookmarkInputValidator.verifyPublicBookmarkExistenceOnUpdate(bookmark, userId);

  const updatedBookmark = await Bookmark.findOneAndUpdate(
    {
      _id: bookmarkId,
      userId: userId
    },
    bookmark,
    {new: true}
  );

  const bookmarkNotFound = !updatedBookmark;
  if (bookmarkNotFound) {
    throw new NotFoundError('Bookmark NOT_FOUND with id: ' + bookmarkId + ' AND location: ' + bookmark.location);
  } else {
    return updatedBookmark;
  }
};

/*
* DELETE bookmark for user
*/
let deleteBookmarkById = async (userId, bookmarkId) => {
  const bookmark = await Bookmark.findOneAndRemove({
    _id: bookmarkId,
    userId: userId
  });

  if (!bookmark) {
    throw new NotFoundError('Bookmark NOT_FOUND with id: ' + bookmarkId);
  } else {
    await User.update(
      {},
      {
        $pull: {
          readLater: bookmarkId,
          likes: bookmarkId,
          pinned: bookmarkId,
          history: bookmarkId,
          favorites: bookmarkId
        }
      },
      {multi: true}
    );

    return true;
  }
};

/*
* DELETE bookmark for user by location
*/
let deleteBookmarkByLocation = async (userId, location) => {
  const bookmark = await Bookmark.findOneAndRemove({
    location: location,
    userId: userId
  });

  if (!bookmark) {
    throw new NotFoundError(`Bookmark NOT_FOUND the userId: ${userId} AND location: ${location}`);
  }

  return true;
};

module.exports = {
  createBookmark: createBookmark,
  getTagsForUser: getTagsForUser,
  getBookmarkById: getBookmarkById,
  getBookmarkByLocation: getBookmarkByLocation,
  getLatestBookmarks: getLatestBookmarks,
  updateBookmark: updateBookmark,
  deleteBookmarkById: deleteBookmarkById,
  deleteBookmarkByLocation: deleteBookmarkByLocation
};
