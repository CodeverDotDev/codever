const Bookmark = require('../../model/bookmark');
// TODO - remove
//  const escapeStringRegexp = require('escape-string-regexp');
const bookmarksSearchHelper = require('../../common/bookmarks-search.helper');

let findPublicBookmarks = async function (query, page, limit, sort, searchInclude) {
  //split in text and tags
  const searchedTermsAndTags = bookmarksSearchHelper.splitSearchQuery(query);
  const searchedTerms = searchedTermsAndTags.terms;
  const searchedTags = searchedTermsAndTags.tags;
  let bookmarks = [];

  const {specialSearchFilters, nonSpecialSearchTerms} = bookmarksSearchHelper.extractSpecialSearchTerms(searchedTerms);

  if ( searchedTerms.length > 0 && searchedTags.length > 0 ) {
    bookmarks = await getPublicBookmarksForTagsAndTerms(searchedTags, nonSpecialSearchTerms, page, limit, sort, specialSearchFilters, searchInclude);
  } else if ( searchedTerms.length > 0 ) {
    bookmarks = await getPublicBookmarksForSearchedTerms(nonSpecialSearchTerms, page, limit, sort, specialSearchFilters, searchInclude);
  } else if ( searchedTags.length > 0 ) {
    bookmarks = await getPublicBookmarksForSearchedTags(searchedTags, page, limit, specialSearchFilters);
  }

  return bookmarks;
}

let addSpecialSearchFiltersToMongoFilter = function (specialSearchFilters, filter) {
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


let getPublicBookmarksForTagsAndTerms = async function (searchedTags, nonSpecialSearchTerms, page, limit, sort, specialSearchFilters, searchInclude) {
  let filter = {
    public: true,
    tags:
      {
        $all: searchedTags
      }
  }

  if ( nonSpecialSearchTerms.length > 0 ) {
    if(searchInclude === 'any') {
      filter.$text = {$search: nonSpecialSearchTerms.join(' ')}
    } else {
      filter.$text = {$search: bookmarksSearchHelper.generateFullSearchText(nonSpecialSearchTerms)};
    }
  }
  addSpecialSearchFiltersToMongoFilter(specialSearchFilters, filter);
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


let getPublicBookmarksForSearchedTerms = async function (nonSpecialSearchTerms, page, limit, sort, specialSearchFilters, searchInclude) {

  let filter = {
    public: true
  }

  if ( nonSpecialSearchTerms.length > 0 ) {
    if(searchInclude === 'any') {
      filter.$text = {$search: nonSpecialSearchTerms.join(' ')}
    } else {
      filter.$text = {$search: bookmarksSearchHelper.generateFullSearchText(nonSpecialSearchTerms)};
    }
  }

  addSpecialSearchFiltersToMongoFilter(specialSearchFilters, filter);

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

  addSpecialSearchFiltersToMongoFilter(specialSearchFilters, filter);

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
