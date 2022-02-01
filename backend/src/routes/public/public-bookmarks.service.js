const Bookmark = require('../../model/bookmark');
const NotFoundError = require('../../error/not-found.error');

let getPublicBookmarkByLocation = async (location) => {
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

let getLatestPublicBookmarks = async (page, limit) => {

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
  const bookmark = await Bookmark.findOne({
    public: true,
    _id: bookmarkId
  });
  if ( !bookmark ) {
    throw new NotFoundError(`Bookmark data NOT_FOUND for id: ${bookmarkId}`);
  }
  return bookmark;
};

let getMostUsedPublicTags = async function (limit) {

  const aggregatedTags = await Bookmark.aggregate([
    //first stage - filter
    {
      $match: {
        public: true
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
    },

    //
    { $limit : limit }
  ]);

  const usedTags = aggregatedTags.map(aggregatedTag => {
    return {
      name: aggregatedTag._id.tag,
      count: aggregatedTag.count
    }
  });

  return usedTags;
}


module.exports = {
  getPublicBookmarkByLocation: getPublicBookmarkByLocation,
  getLatestPublicBookmarks: getLatestPublicBookmarks,
  getBookmarksForTag: getBookmarksForTag,
  getBookmarkById: getBookmarkById,
  getMostUsedPublicTags: getMostUsedPublicTags
};
