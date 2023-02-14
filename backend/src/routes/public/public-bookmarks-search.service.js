const Bookmark = require('../../model/bookmark');
// TODO - remove
//  const escapeStringRegexp = require('escape-string-regexp');
const searchUtils = require('../../common/search.utils');

let findPublicBookmarks = async function (query, page, limit, sort, searchInclude) {
  //split in text and tags
  const searchedTermsAndTags = searchUtils.splitSearchQuery(query);
  const searchedTerms = searchedTermsAndTags.terms;
  const searchedTags = searchedTermsAndTags.tags;
  let bookmarks = [];

  const {specialSearchTerms, fulltextSearchTerms} = searchUtils.extractFulltextAndSpecialSearchTerms(searchedTerms);

  if ( searchedTerms.length > 0 && searchedTags.length > 0 ) {
    bookmarks = await getPublicBookmarksForTagsAndTerms(searchedTags, fulltextSearchTerms, page, limit, sort, specialSearchTerms, searchInclude);
  } else if ( searchedTerms.length > 0 ) {
    bookmarks = await getPublicBookmarksForSearchedTerms(fulltextSearchTerms, page, limit, sort, specialSearchTerms, searchInclude);
  } else if ( searchedTags.length > 0 ) {
    bookmarks = await getPublicBookmarksForSearchedTags(searchedTags, page, limit, specialSearchTerms);
  }

  return bookmarks;
}

let setSpecialSearchTermsFilter = function (specialSearchFilters, filter) {
  if ( specialSearchFilters.userId ) {
    filter.userId = specialSearchFilters.userId;
  }

  if ( specialSearchFilters.lang ) {
    filter.language = specialSearchFilters.lang
  }

  if ( specialSearchFilters.site ) {
    filter.location = new RegExp(specialSearchFilters.site, 'i');
  }
};


let getPublicBookmarksForTagsAndTerms = async function (searchedTags, fulltextSearchTerms, page, limit, sort, specialSearchFilters, searchInclude) {
  let filter = {
    public: true,
    tags:
      {
        $all: searchedTags
      }
  }

  if ( fulltextSearchTerms.length > 0 ) {
    if(searchInclude === 'any') {
      filter.$text = {$search: fulltextSearchTerms.join(' ')}
    } else {
      filter.$text = {$search: searchUtils.generateFullSearchText(fulltextSearchTerms)};
    }
  }
  setSpecialSearchTermsFilter(specialSearchFilters, filter);
  let sortBy = {};
  if ( sort === 'newest' ) {
    sortBy.createdAt = -1;
  } else {
    sortBy.score = {$meta: "textScore"}
  }

  let bookmarks = await Bookmark.find(
    filter,
    {
      score: {$meta: "textScore"}
    }
  )
    .sort(sortBy)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
    .exec();

  return bookmarks;
}


let getPublicBookmarksForSearchedTerms = async function (fulltextSearchTerms, page, limit, sort, specialSearchFilters, searchInclude) {

  let filter = {
    public: true
  }

  if ( fulltextSearchTerms.length > 0 ) {
    if(searchInclude === 'any') {
      filter.$text = {$search: fulltextSearchTerms.join(' ')}
    } else {
      filter.$text = {$search: searchUtils.generateFullSearchText(fulltextSearchTerms)};
    }
  }

  setSpecialSearchTermsFilter(specialSearchFilters, filter);

  let sortBy = {};
  if ( sort === 'newest' ) {
    sortBy.createdAt = -1;
  } else {
    sortBy.score = {$meta: "textScore"}
  }

  let bookmarks = await Bookmark.find(
    filter,
    {
      score: {$meta: "textScore"}
    }
  )
    .sort(sortBy)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
    .exec();

  return bookmarks;
}

let getPublicBookmarksForSearchedTags = async function (searchedTags, page, limit, specialSearchFilters) {
  let filter = {
    public: true,
    tags:
      {
        $all: searchedTags
      }
  }

  setSpecialSearchTermsFilter(specialSearchFilters, filter);

  let bookmarks = await Bookmark.find(filter)
    .sort({createdAt: -1})
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
    .exec();

  return bookmarks;
}

module.exports = {
  findPublicBookmarks: findPublicBookmarks
}
