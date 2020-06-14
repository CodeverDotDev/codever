const constants = require('../../common/constants');

const User = require('../../model/user');
const Bookmark = require('../../model/bookmark');

const ValidationError = require('../../error/validation.error');
const NotFoundError = require('../../error/not-found.error');
const PublicBookmarksService = require('../public/public-bookmarks.service');

let createUserData = async function (userData, userId) {

  validateUserData(userData, userId);

  const newUserData = new User({
    userId: userId,
    profile: userData.profile,
    searches: userData.searches,
    readLater: userData.readLater,
    likes: userData.likes,
    watchedTags: userData.watchedTags,
    ignoredTags: userData.ignoredTags,
    pinned: userData.pinned,
    favorites: userData.favorites,
    history: userData.history
  });

  const createdUserData = await newUserData.save();

  return createdUserData;
}

let updateUserData = async function (userData, userId) {

  validateUserData(userData, userId);

  //hold max 50 bookmarks in history or pinned
  if ( userData.history.length > constants.MAX_NUMBER_STORED_BOOKMARKS_FOR_PERSONAL_STORE ) {
    userData.history = userData.history.slice(0, constants.MAX_NUMBER_STORED_BOOKMARKS_FOR_PERSONAL_STORE);
  }

  if ( userData.pinned.length > constants.MAX_NUMBER_STORED_BOOKMARKS_FOR_PERSONAL_STORE ) {
    userData.pinned = userData.pinned.slice(0, constants.MAX_NUMBER_STORED_BOOKMARKS_FOR_PERSONAL_STORE);
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
  }).select("+followers");

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

let getReadLater = async function (userId, page, limit) {

  const userData = await User.findOne({
    userId: userId
  });
  if ( !userData ) {
    throw new NotFoundError(`User data NOT_FOUND for userId: ${userId}`);
  } else {
    const readLaterRangeIds = userData.readLater.slice((page - 1) * limit, (page - 1) * limit + limit);
    const bookmarks = await Bookmark.find({"_id": {$in: readLaterRangeIds}});

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

let getUsedTagsForPublicBookmarks = async function (userId) {

  const aggregatedTags = await Bookmark.aggregate([
    //first stage - filter
    {
      $match: {
        userId: userId,
        public: true,
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
        public: false
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

let getPinnedBookmarks = async function (userId, page, limit) {

  const userData = await User.findOne({
    userId: userId
  });
  if ( !userData ) {
    throw new NotFoundError(`User data NOT_FOUND for userId: ${userId}`);
  } else {
    const pinnedRangeIds = userData.pinned.slice((page - 1) * limit, (page - 1) * limit + limit);
    const bookmarks = await Bookmark.find({"_id": {$in: pinnedRangeIds}});
    //we need to order the bookmarks to correspond the one in the userData.pinned array
    const orderedBookmarksAsInPinned = bookmarks.sort(function (a, b) {
      return pinnedRangeIds.indexOf(a._id) - pinnedRangeIds.indexOf(b._id);
    });

    return orderedBookmarksAsInPinned.filter(bookmark => bookmark !== undefined);
  }
}

/**
 * Deprecated - might get reactivated if community decides for it
 *
 */
let getFavoriteBookmarks = async function (userId, page, limit) {
  const userData = await User.findOne({
    userId: userId
  });
  if ( !userData ) {
    throw new NotFoundError(`User data NOT_FOUND for userId: ${userId}`);
  } else {
    const favoritesRangeIds = userData.favorites.slice((page - 1) * limit, (page - 1) * limit + limit);
    const bookmarks = await Bookmark.find({"_id": {$in: favoritesRangeIds}});
    //we need to order the bookmarks to correspond the one in the userData.favorites array
    const orderedBookmarksAsInFavorites = bookmarks.sort(function (a, b) {
      return favoritesRangeIds.indexOf(a._id) - favoritesRangeIds.indexOf(b._id);
    });

    return orderedBookmarksAsInFavorites;
  }
}

let getBookmarksFromHistory = async function (userId, page, limit) {

  const userData = await User.findOne({
    userId: userId
  });
  if ( !userData ) {
    throw new NotFoundError(`User data NOT_FOUND for userId: ${userId}`);
  } else {
    const historyRangeIds = userData.history.slice((page - 1) * limit, (page - 1) * limit + limit);
    const bookmarks = await Bookmark.find({"_id": {$in: historyRangeIds}});

    //we need to order the bookmarks to correspond the one in the userData.history array
    const orderedBookmarksAsInHistory = bookmarks.sort(function (a, b) {
      return historyRangeIds.indexOf(a._id) - historyRangeIds.indexOf(b._id);
    });

    //check for "potentially" deleted bookmarks via "delete all private for tag"
    //return orderedBookmarksAsInHistory.filter(bookmark => bookmark !== undefined);
    return orderedBookmarksAsInHistory;
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
      return await unlikeBookmark(userData, userId, bookmarkId);
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

    const bookmark = await Bookmark.findOneAndUpdate({_id: bookmarkId}, {$inc: {likeCount: 1}});

    const bookmarkNotFound = !bookmark;
    if ( bookmarkNotFound ) {
      throw new NotFoundError('Bookmark with bookmark id ' + bookmarkId + ' not found');
    } else {
      return bookmark;
    }
  }
}

let unlikeBookmark = async function (userData, userId, bookmarkId) {
  if ( !userData.likes.includes(bookmarkId) ) {
    throw new ValidationError('You did not like this bookmark', ['You did not like this bookmark']);
  } else {

    await User.update(
      {userId: userId},
      {$pull: {likes: bookmarkId}}
    );

    const bookmark = await Bookmark.findOneAndUpdate({_id: bookmarkId}, {$inc: {likeCount: -1}});
    const bookmarkNotFound = !bookmark;
    if ( bookmarkNotFound ) {
      throw new NotFoundError('Bookmark with bookmark id ' + bookmarkId + ' not found');
    } else {
      return bookmark;
    }
  }
}

let followUser = async function (userId, followedUserId) {
  const updatedUserData = await User.findOneAndUpdate(
    {userId: userId},
    {$push: {'following.users': followedUserId}},
    {new: true}
  );

  await User.findOneAndUpdate(
    {userId: followedUserId},
    {$push: {followers: userId}}
  );

  return updatedUserData;
}

let unfollowUser = async function (userId, followedUserId) {
  const updatedUserData = await User.findOneAndUpdate(
    {userId: userId},
    {$pull: {'following.users': followedUserId}},
    {new: true}
  );

  await User.findOneAndUpdate(
    {userId: followedUserId},
    {$pull: {followers: userId}}
  );

  return updatedUserData;
}

let getFollowedUsersData = async function (userId) {
  const userData = await User.findOne({
    userId: userId
  });

  if ( !userData ) {
    throw new NotFoundError(`User data NOT_FOUND for userId: ${userId}`);
  } else {
    const followedUsers = await User.find(
      {userId: {$in: userData.following.users}}
    ).select('userId profile');

    return followedUsers;
  }
}
let getFollowers = async function (userId) {
  const userData = await User.findOne({
    userId: userId
  }).select("+followers");

  if ( !userData ) {
    throw new NotFoundError(`User data NOT_FOUND for userId: ${userId}`);
  } else {
    const followers = await User.find(
      {userId: {$in: userData.followers}}
    ).select('userId profile');

    return followers;
  }
}

/**
 * Highly unlikely case if the user is following popular tags
 * It returns bookmarks tagged with user's watched tags and if end is reached
 * the recent public bookmarks except ignored.
 *
 * @param userId
 * @param page
 * @param limit
 * @returns {Promise<void>}
 */

let getFeedBookmarks = async function (userId, page, limit) {
  const userData = await User.findOne({
    userId: userId
  });
  if ( !userData ) {
    // falls back to getting the public bookmarks - the case happens when the user register for the first time via Keycloak
    return PublicBookmarksService.getLatestPublicBookmarks(page, limit);
  } else {

    const filterFeedBookmarks = {
      public: true,
      $and: [
        {
          tags: {
            $elemMatch: {$in: userData.watchedTags}
          }
        },
        {
          tags: {
            $not: {$elemMatch: {$in: userData.ignoredTags}}
          }
        }
      ]
    };

    let bookmarks = await Bookmark.find(filterFeedBookmarks)
      .sort({createdAt: -1})
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();


    if ( bookmarks.length < limit ) {
      const count = await Bookmark.countDocuments(filterFeedBookmarks);

      const intervalRight = page * limit;
      const pageOtherPublicBookmarks = count === 0 ? page -1 : Math.floor((intervalRight - count) / limit );
      const limitOtherPublicBookmarks = intervalRight - count < limit ? intervalRight - count : limit;

      const otherPublicBookmarks = await Bookmark.find({
        public: true,
        $and: [
          {
            tags: {
              $not: {$elemMatch: {$in: userData.watchedTags}}
            }
          },
          {
            tags: {
              $not: {$elemMatch: {$in: userData.ignoredTags}}
            }
          }
        ]
      })
        .sort({createdAt: -1})
        .skip(pageOtherPublicBookmarks * limit)
        .limit(limitOtherPublicBookmarks)
        .lean()
        .exec();

      bookmarks = bookmarks.concat(otherPublicBookmarks);
    }

    return bookmarks;
  }
}

module.exports = {
  updateUserData: updateUserData,
  createUserData: createUserData,
  getUserData: getUserData,
  deleteUserData: deleteUserData,
  getReadLater: getReadLater,
  getLikedBookmarks: getLikedBookmarks,
  getUsedTagsForPublicBookmarks: getUsedTagsForPublicBookmarks,
  getUsedTagsForPrivateBookmarks: getUsedTagsForPrivateBookmarks,
  getPinnedBookmarks: getPinnedBookmarks,
  getFavoriteBookmarks: getFavoriteBookmarks,
  getBookmarksFromHistory: getBookmarksFromHistory,
  rateBookmark: rateBookmark,
  followUser: followUser,
  unfollowUser: unfollowUser,
  getFollowedUsersData: getFollowedUsersData,
  getFollowers: getFollowers,
  getFeedBookmarks: getFeedBookmarks
}
