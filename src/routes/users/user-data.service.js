const User = require('../../model/user');
const Bookmark = require('../../model/bookmark');

const ValidationError = require('../../error/validation.error');
const NotFoundError = require('../../error/not-found.error');

let createUserData = async function (userData, userId) {

  validateUserData(userData, userId);

  const newUserData = new User({
    userId: userId,
    searches: userData.searches,
    readLater: userData.readLater,
    likes: userData.likes,
    watchedTags: userData.watchedTags,
    pinned: userData.pinned,
    favorites: userData.favorites,
    history: userData.history
  });

  const createdUserData = await newUserData.save();

  return createdUserData;
}

let updateUserData = async function (userData, userId) {

  validateUserData(userData, userId);

  //hold only 30 bookmarks in history or pinned
  if ( userData.history.length > 30 ) {
    userData.history = userData.history.slice(0, 3);
  }

  if ( userData.pinned.length > 30 ) {
    userData.pinned = userData.pinned.slice(0, 3);
  }

  delete userData._id;//once we proved it's present we delete it to avoid the following MOngoError by findOneAndUpdate
  // MongoError: After applying the update to the document {_id: ObjectId('5c513150e13cda73420a9602') , ...}, the (immutable) field '_id' was found to have been altered to _id: "5c513150e13cda73420a9602"
  const updatedUserData = await User.findOneAndUpdate(
    {userId: userData.userId},
    userData,
    {upsert: true, new: true}, // options
  );

  return updatedUserData;
}

function validateUserData(userData, userId) {

  let validationErrorMessages = [];

  const invalidUserIdInUserData = !userData.userId || userData.userId !== userId;
  if ( invalidUserIdInUserData ) {
    validationErrorMessages.push('Missing or invalid userId in provided user data');
  }

  if ( !userSearchesAreValid(userData) ) {
    validationErrorMessages.push('Searches are not valid - search text is required');
  }

  if ( validationErrorMessages.length > 0 ) {
    throw new ValidationError('Submitted user data is not valid', validationErrorMessages);
  }
}

function userSearchesAreValid(userData) {
  const searches = userData.searches;
  if ( searches && searches.length > 0 ) {
    for ( let i = 0; i < searches.length; i++ ) {
      if ( !searches[i].text ) {
        return false;
      }
    }
  }

  return true;
}

let getUserData = async function (userId) {
  const userData = await User.findOne({
    userId: userId
  });

  if ( !userData ) {
    throw new NotFoundError(`User data NOT_FOUND for userId: ${userId}`);
  } else {
    return userData;
  }
}

let deleteUserData = async function (userId) {
  const userData = await User.findOneAndRemove({
    userId: userId
  });

  if ( !userData ) {
    throw new NotFoundError(`User data NOT_FOUND for userId: ${userId}`);
  } else {
    return 'user deleted';
  }
}

let getLaterReads = async function (userId) {

  const userData = await User.findOne({
    userId: userId
  });
  if ( !userData ) {
    throw new NotFoundError(`User data NOT_FOUND for userId: ${userId}`);
  } else {
    const bookmarks = await Bookmark.find({"_id": {$in: userData.readLater}});

    return bookmarks;
  }
}

let getLikedBookmarks = async function (userId) {

  const userData = await User.findOne({
    userId: userId
  });
  if ( !userData ) {
    throw new NotFoundError(`User data NOT_FOUND for userId: ${userId}`);
  } else {
    const bookmarks = await Bookmark.find({"_id": {$in: userData.likes}});

    return bookmarks;
  }
}

let getWatchedTags = async function (userId) {
  const userData = await User.findOne({
    userId: userId
  });
  if ( !userData ) {
    throw new NotFoundError(`User data NOT_FOUND for userId: ${userId}`);
  } else {
    const bookmarks = await Bookmark.find({
      shared: true,
      tags: {$elemMatch: {$in: userData.watchedTags}}
    })
      .sort({createdAt: -1})
      .limit(100)
      .lean()
      .exec();

    return bookmarks;
  }
}

let getUsedTagsForPublicBookmarks = async function (userId) {

  const aggregatedTags = await Bookmark.aggregate([
    //first stage - filter
    {
      $match: {
        userId: userId,
        shared: true,
      },
    },

    //second stage - unwind tags
    {$unwind: "$tags"},

    //third stage - group
    {
      $group: {
        _id: {
          tag: '$tags'
        },
        count: {
          $sum: 1
        }
      }
    },

    //fourth stage - order by count desc
    {
      $sort: {count: -1}
    }

  ]);

  const usedTags = aggregatedTags.map(aggregatedTag => {
    return {
      name: aggregatedTag._id.tag,
      count: aggregatedTag.count
    }
  });

  return usedTags;
}

let getUsedTagsForPrivateBookmarks = async function (userId) {

  const aggregatedTags = await Bookmark.aggregate([
    //first stage - filter
    {
      $match: {
        userId: userId,
        shared: false
      },
    },

    //second stage - unwind tags
    {$unwind: "$tags"},

    //third stage - group
    {
      $group: {
        _id: {
          tag: '$tags'
        },
        count: {
          $sum: 1
        }
      }
    },

    //fourth stage - order by count desc
    {
      $sort: {count: -1}
    }

  ]);

  const usedTags = aggregatedTags.map(aggregatedTag => {
    return {
      name: aggregatedTag._id.tag,
      count: aggregatedTag.count
    }
  });

  return usedTags;
}

let getPinnedBookmarks = async function (userId) {

  const userData = await User.findOne({
    userId: userId
  });
  if ( !userData ) {
    throw new NotFoundError(`User data NOT_FOUND for userId: ${userId}`);
  } else {
    const bookmarks = await Bookmark.find({"_id": {$in: userData.pinned}});
    //we need to order the bookmarks to correspond the one in the userData.pinned array
    const orderedBookmarksAsInPinned = userData.pinned.map(bookmarkId => {
      return bookmarks.filter(bookmark => bookmark._id.toString() === bookmarkId)[0];
    });

    return orderedBookmarksAsInPinned.filter(bookmark => bookmark !== undefined);
  }
}

let getFavoriteBookmarks = async function (userId) {
  const userData = await User.findOne({
    userId: userId
  });
  if ( !userData ) {
    throw new NotFoundError(`User data NOT_FOUND for userId: ${userId}`);
  } else {
    const bookmarks = await Bookmark.find({"_id": {$in: userData.favorites}});
    //we need to order the bookmarks to correspond the one in the userData.favorites array
    const orderedBookmarksAsInFavorites = userData.favorites.map(bookmarkId => {
      return bookmarks.filter(bookmark => bookmark._id.toString() === bookmarkId)[0];
    });

    return orderedBookmarksAsInFavorites;
  }
}

let getBookmarksFromHistory = async function (userId) {

  const userData = await User.findOne({
    userId: userId
  });
  if ( !userData ) {
    throw new NotFoundError(`User data NOT_FOUND for userId: ${userId}`);
  } else {
    const bookmarks = await Bookmark.find({"_id": {$in: userData.history}});

    //we need to order the bookmarks to correspond the one in the userData.history array
    const orderedBookmarksAsInHistory = userData.history.map(bookmarkId => {
      return bookmarks.filter(bookmark => bookmark._id.toString() === bookmarkId)[0];
    });

    //check for "potentially" deleted bookmarks via "delete all private for tag"
    return orderedBookmarksAsInHistory.filter(bookmark => bookmark !== undefined);
  }
}

let rateBookmark = async function (receivedUserData, userId, bookmarkId) {

  validateInputForBookmarkRating(receivedUserData, userId);

  const userData = await User.findOne({
    userId: userId
  });

  if ( !userData ) {
    throw new NotFoundError(`User data NOT_FOUND for userId: ${userId}`);
  } else {
    if ( receivedUserData.action === 'LIKE' ) {
      return await likeBookmark(userData, userId, bookmarkId);
    } else if ( receivedUserData.action === 'UNLIKE' ) {
      return await dislikeBookmark(userData, userId, bookmarkId);
    }
  }
}

let validateInputForBookmarkRating = function (userData, userId) {
  let validationErrorMessages = [];
  if ( userId !== userData.ratingUserId ) {
    validationErrorMessages.push('The ratingUserId in the request.body must be the same as the userId request parameter');
  }
  if ( !userData.action ) {
    validationErrorMessages.push('Missing required attributes - action');
  }
  if ( !(userData.action === 'LIKE' || userData.action === 'UNLIKE') ) {
    validationErrorMessages.push('Invalid value - rating action should be LIKE or UNLIKE');
  }
  if ( validationErrorMessages.length > 0 ) {
    throw new ValidationError('Rating bookmark input is not valid', validationErrorMessages);
  }
}

let likeBookmark = async function (userData, userId, bookmarkId) {
  if ( userData.likes.includes(bookmarkId) ) {
    throw new ValidationError('You already starred this bookmark', ['You already starred this bookmark']);
  } else {

    await User.update(
      {userId: userId},
      {$push: {likes: bookmarkId}}
    );

    const bookmark = await Bookmark.findOneAndUpdate({_id: bookmarkId}, {$inc: {likes: 1}});

    const bookmarkNotFound = !bookmark;
    if ( bookmarkNotFound ) {
      throw new NotFoundError('Bookmark with bookmark id ' + bookmarkId + ' not found');
    } else {
      return bookmark;
    }
  }
}

let dislikeBookmark = async function (userData, userId, bookmarkId) {
  if ( !userData.likes.includes(bookmarkId) ) {
    throw new ValidationError('You did not like this bookmark', ['You did not like this bookmark']);
  } else {

    await User.update(
      {userId: userId},
      {$pull: {likes: bookmarkId}}
    );

    const bookmark = await Bookmark.findOneAndUpdate({_id: bookmarkId}, {$inc: {likes: -1}});
    const bookmarkNotFound = !bookmark;
    if ( bookmarkNotFound ) {
      throw new NotFoundError('Bookmark with bookmark id ' + bookmarkId + ' not found');
    } else {
      return bookmark;
    }
  }
}

module.exports = {
  updateUserData: updateUserData,
  createUserData: createUserData,
  getUserData: getUserData,
  deleteUserData: deleteUserData,
  getLaterReads: getLaterReads,
  getLikedBookmarks: getLikedBookmarks,
  getWatchedTags: getWatchedTags,
  getUsedTagsForPublicBookmarks: getUsedTagsForPublicBookmarks,
  getUsedTagsForPrivateBookmarks: getUsedTagsForPrivateBookmarks,
  getPinnedBookmarks: getPinnedBookmarks,
  getFavoriteBookmarks: getFavoriteBookmarks,
  getBookmarksFromHistory: getBookmarksFromHistory,
  rateBookmark: rateBookmark
}
