const Bookmark = require('../../model/bookmark');
const escapeStringRegexp = require('escape-string-regexp');
const bookmarksSearchHelper = require('../../common/bookmarks-search.helper');

let findPublicBookmarks = async function (query, limit) {
  //split in text and tags
  const searchedTermsAndTags = bookmarksSearchHelper.splitSearchQuery(query);
  const searchedTerms = searchedTermsAndTags.terms;
  const searchedTags = searchedTermsAndTags.tags;
  let bookmarks = [];

  const {specialSearchFilters, nonSpecialSearchTerms} = bookmarksSearchHelper.extractSpecialSearchTerms(searchedTerms);

  if ( nonSpecialSearchTerms.length > 0 && searchedTags.length > 0 ) {
    bookmarks = await getPublicBookmarksForTagsAndTerms(searchedTags, nonSpecialSearchTerms, limit, specialSearchFilters);
  } else if ( nonSpecialSearchTerms.length > 0 ) {
    bookmarks = await getPublicBookmarksForSearchedTerms(nonSpecialSearchTerms, limit, specialSearchFilters);
  } else if ( searchedTags.length > 0 ) {
    bookmarks = await getPublicBookmarksForSearchedTags(searchedTags, limit, specialSearchFilters);
  } else if(specialSearchFilters.userId) {
    bookmarks = await getPublicBookmarksForUser(limit, specialSearchFilters.userId);
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


let getPublicBookmarksForTagsAndTerms = async function (searchedTags, searchedTerms, limit, specialSearchFilters) {
  let filter = {
    shared: true,
    tags:
      {
        $all: searchedTags
      },
    $text:
      {
        $search: searchedTerms.join(' ')
      }
  }

  addSpecialSearchFiltersToMongoFilter(specialSearchFilters, filter);

  let bookmarks = await Bookmark.find(
    filter,
    {
      score: {$meta: "textScore"}
    }
  )
  //.sort({createdAt: -1})
    .sort({score: {$meta: "textScore"}})
    .lean()
    .exec();

  for ( const term of searchedTerms ) {
    bookmarks = bookmarks.filter(bookmark => bookmarksSearchHelper.bookmarkContainsSearchedTerm(bookmark, term.trim()));
  }
  bookmarks = bookmarks.slice(0, limit);

  return bookmarks;
}

let getPublicBookmarksForSearchedTerms = async function (searchedTerms, limit, specialSearchFilters) {

  const termsJoined = searchedTerms.join(' ');
  const termsQuery = escapeStringRegexp(termsJoined);
  let filter = {
    shared: true,
    $text: {$search: termsQuery}
  }

  addSpecialSearchFiltersToMongoFilter(specialSearchFilters, filter);

  let bookmarks = await Bookmark.find(
    filter,
    {
      score: {$meta: "textScore"}
    }
  )
  //.sort({createdAt: -1}) //let's give it a try with text score
    .sort({score: {$meta: "textScore"}})
    .lean()
    .exec();

  for ( const term of searchedTerms ) {
    bookmarks = bookmarks.filter(bookmark => bookmarksSearchHelper.bookmarkContainsSearchedTerm(bookmark, term.trim()));
  }
  bookmarks = bookmarks.slice(0, limit);

  return bookmarks;
}

let getPublicBookmarksForSearchedTags = async function (searchedTags, limit, specialSearchFilters) {
  let filter = {
    shared: true,
    tags:
      {
        $all: searchedTags
      }
  }

  addSpecialSearchFiltersToMongoFilter(specialSearchFilters, filter);

  let bookmarks = await Bookmark.find(filter)
    .sort({createdAt: -1})
    .limit(limit)
    .lean()
    .exec();

  return bookmarks;
}

let getPublicBookmarksForUser = async function (limit, userId) {

  let filter = {
    shared: true,
    userId: userId
  }

  let bookmarks = await Bookmark.find(filter)
    .sort({createdAt: -1})
    .limit(limit)
    .lean()
    .exec();

  return bookmarks;
}

module.exports = {
  findPublicBookmarks: findPublicBookmarks
}
