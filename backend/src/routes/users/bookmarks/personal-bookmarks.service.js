const Bookmark = require('../../../model/bookmark');
const User = require('../../../model/user');

const NotFoundError = require('../../../error/not-found.error');

const BookmarkInputValidator = require('../../../common/bookmark-input.validator');
const {
  v4: uuidv4,
} = require('uuid');

/**
 * CREATE bookmark for user
 */
let createBookmark = async function (userId, bookmark) {
  BookmarkInputValidator.validateBookmarkInput(userId, bookmark);

  await BookmarkInputValidator.verifyPublicBookmarkExistenceOnCreation(bookmark);

  let newBookmark = await bookmark.save();

  return newBookmark;
}

/* GET suggested tags used for user */
let getSuggestedTagsForUser = async (userId) => {

  const tags = await Bookmark.distinct("tags",
    {
      $or: [
        {userId: userId},
        {public: true}
      ]
    }); // sort does not work with distinct in mongoose - https://mongoosejs.com/docs/api.html#query_Query-sort

  return tags;
};


/* GET tags used by user */
let getUserTagsAggregated = async (userId) => {

  const aggregatedTags = await Bookmark.aggregate([
    //first stage - filter
    {
      $match: {
        userId: userId
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

  const userTags = aggregatedTags.map(aggregatedTag => {
    return {
      name: aggregatedTag._id.tag,
      count: aggregatedTag.count
    }
  });

  return userTags;
};


/* GET bookmark of user by bookmarkId */
let getBookmarkById = async (userId, bookmarkId) => {

  const bookmark = await Bookmark.findOne({
    _id: bookmarkId,
    userId: userId
  });

  if ( !bookmark ) {
    throw new NotFoundError(`Bookmark NOT_FOUND the userId: ${userId} AND id: ${bookmarkId}`);
  } else {
    return bookmark;
  }
};

/* GET bookmark of user by location*/
let getPersonalBookmarkByLocation = async (userId, location) => {

  const bookmark = await Bookmark.findOne({
    userId: userId,
    location: location
  }).lean().exec();

  if ( !bookmark ) {
    return [];
  } else {
    return [bookmark];
  }
};

/* GET last accessed bookmarks of the - currently there is a limit set to 100 */
let getLastAccessedBookmarks = async (userId) => {
  const bookmarks = await Bookmark.find({userId: userId})
    .sort({lastAccessedAt: -1})
    .limit(100);

  return bookmarks;
};

/* GET all the bookmarks of the user*/
let getAllMyBookmarks = async (userId) => {
  const bookmarks = await Bookmark.find({userId: userId})
    .select('-descriptionHtml')
    .sort({createdAt: -1});

  return bookmarks;
};

/* GET last created bookmarks of the user - currently there is a limit set to 100 */
let getLastCreatedBookmarks = async (userId) => {
  const bookmarks = await Bookmark.find({userId: userId})
    .sort({createdAt: -1})
    .limit(30);

  return bookmarks;
};

/* GET last created bookmarks of the user - currently there is a limit set to 100 */
let getMostLikedBookmarks = async (userId) => {
  const bookmarks = await Bookmark.find({userId: userId})
    .sort({likeCount: -1})
    .limit(30);

  return bookmarks;
};

/* GET last created bookmarks of the user - currently there is a limit set to 100 */
let getMostUsedBookmarks = async (userId) => {
  const bookmarks = await Bookmark.find({userId: userId, ownerVisitCount: {$exists: true}})
    .select('+ownerVisitCount')
    .sort({ownerVisitCount: -1})
    .limit(30);

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
  if ( bookmarkNotFound ) {
    throw new NotFoundError('Bookmark NOT_FOUND with id: ' + bookmarkId + ' AND location: ' + bookmark.location);
  } else {
    return updatedBookmark;
  }
};

let increaseOwnerVisitCount = async (userId, bookmarkId) => {
  await Bookmark.findOneAndUpdate(
    {
      _id: bookmarkId,
      userId: userId
    },
    {
      $inc: {ownerVisitCount: 1}
    }
  );
}

let getOrCreateShareableId = async (userId, bookmarkId) => {
  const bookmark = await Bookmark.findOne(
    {
      _id: bookmarkId,
      userId: userId
    }).select('+shareableId');

  if ( bookmark.shareableId ) {
    return bookmark.shareableId
  } else {
    const uuid = uuidv4();
    const updatedBookmark = await Bookmark.findOneAndUpdate(
      {
        _id: bookmarkId,
        userId: userId
      },
      {
        $set: {shareableId: uuid}
      },
      {new: true}
    ).select('+shareableId');

    return updatedBookmark.shareableId;
  }
}


/*
* DELETE bookmark for user
*/
let deleteBookmarkById = async (userId, bookmarkId) => {
  const response = await Bookmark.deleteOne({
    _id: bookmarkId,
    userId: userId
  });

  if ( response.deletedCount !== 1 ) {
    throw new NotFoundError('Bookmark NOT_FOUND with id: ' + bookmarkId);
  } else {
    await User.update(
      {},
      {
        $pull: {
          readLater: bookmarkId,
          likes: bookmarkId,
          pinned: bookmarkId,
          history: bookmarkId
        }
      },
      {multi: true}
    );

    return true;
  }
};

/*
* DELETE bookmark for user by "location"
*/
let deleteBookmarkByLocation = async (userId, location) => {
  const bookmark = await Bookmark.findOneAndRemove({
    location: location,
    userId: userId
  });

  if ( !bookmark ) {
    throw new NotFoundError(`Bookmark NOT_FOUND the userId: ${userId} AND location: ${location}`);
  }

  return true;
};

/*
* DELETE private bookmarks for user by "tag"
*/
let deletePrivateBookmarksByTag = async (userId, tag) => {
  const bookmarksToBeDeleted = await Bookmark.find({
    userId: userId,
    public: false,
    tags: tag
  });

  const bookmarksToBeDeleteIds = bookmarksToBeDeleted.map(bookmark => bookmark._id.toString());

  const deletedResponse = await Bookmark.deleteMany({
    userId: userId,
    public: false,
    tags: tag
  });

  await User.updateOne(
    {userId: userId},
    {
      $pull: {
        history: {$in: bookmarksToBeDeleteIds},
        pinned: {$in: bookmarksToBeDeleteIds},
        readLater: {$in: bookmarksToBeDeleteIds}
      }
    }
  );

  return deletedResponse.deletedCount;
};

/*
* Update displayName in all bookmarks of user
*/
let updateDisplayNameInBookmarks = async (userId, displayName) => {

  await Bookmark.updateMany({userId: userId}, {$set: {userDisplayName: displayName}});

  return true;
};

module.exports = {
  createBookmark: createBookmark,
  getSuggestedTagsForUser: getSuggestedTagsForUser,
  getBookmarkById: getBookmarkById,
  getPersonalBookmarkByLocation: getPersonalBookmarkByLocation,
  getLastAccessedBookmarks: getLastAccessedBookmarks,
  getAllMyBookmarks: getAllMyBookmarks,
  getLastCreatedBookmarks: getLastCreatedBookmarks,
  getMostUsedBookmarks: getMostUsedBookmarks,
  getMostLikedBookmarks: getMostLikedBookmarks,
  updateBookmark: updateBookmark,
  increaseOwnerVisitCount: increaseOwnerVisitCount,
  deleteBookmarkById: deleteBookmarkById,
  deleteBookmarkByLocation: deleteBookmarkByLocation,
  deletePrivateBookmarksByTag: deletePrivateBookmarksByTag,
  getUserTagsAggregated: getUserTagsAggregated,
  updateDisplayNameInBookmarks: updateDisplayNameInBookmarks,
  getOrCreateSharableId: getOrCreateShareableId
};
