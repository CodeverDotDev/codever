const Bookmark = require('../../../model/bookmark');
const User = require('../../../model/user');
const escapeStringRegexp = require('escape-string-regexp');

const bookmarksSearchHelper = require('../../../common/bookmarks-search.helper');

let findPersonalBookmarks = async function (query, page, limit, userId) {
  //split in text and tags
  const searchedTermsAndTags = bookmarksSearchHelper.splitSearchQuery(query);
  let searchedTerms = searchedTermsAndTags.terms;
  const searchedTags = searchedTermsAndTags.tags;
  let bookmarks = [];

  const {specialSearchFilters, nonSpecialSearchTerms} = bookmarksSearchHelper.extractSpecialSearchTerms(searchedTerms);

  if ( searchedTerms.length > 0 && searchedTags.length > 0 ) {
    bookmarks = await getPersonalBookmarksForTagsAndTerms(searchedTags, nonSpecialSearchTerms, page, limit, userId, specialSearchFilters);
  } else if ( searchedTerms.length > 0 ) {
    bookmarks = await getPersonalBookmarksForSearchedTerms(nonSpecialSearchTerms, page, limit, userId, specialSearchFilters);
  } else {
    bookmarks = await getPersonalBookmarksForSearchedTags(searchedTags, page, limit, userId, specialSearchFilters);
  }

  return bookmarks;
}

let addSpecialSearchFiltersToMongoFilter = function (specialSearchFilters, filter) {
  if ( specialSearchFilters.privateOnly ) {
    filter.public = false;
  }

  if ( specialSearchFilters.lang ) {
    filter.language = specialSearchFilters.lang
  }

  if ( specialSearchFilters.site ) {
    filter.location = new RegExp(specialSearchFilters.site, 'i'); //TODO when performance becomes an issue extract domains from URLs and make a direct comparison with the domain
  }
};

let getPersonalBookmarksForTagsAndTerms = async function (searchedTags, nonSpecialSearchTerms, page, limit, userId, specialSearchFilters) {
  let filter = {
    tags:
      {
        $all: searchedTags
      }
  }

  if ( nonSpecialSearchTerms.length > 0 ) {
    filter.$text =
      {
        $search: nonSpecialSearchTerms.join(' ')
      }
  }

  addSpecialSearchFiltersToMongoFilter(specialSearchFilters, filter);

  const userData = await User.findOne({
    userId: userId
  });
  filter.$or = [
    {userId: userId},
    {"_id": {$in: userData.favorites}}
  ]

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

  for ( const term of nonSpecialSearchTerms ) {
    bookmarks = bookmarks.filter(bookmark => bookmarksSearchHelper.bookmarkContainsSearchedTerm(bookmark, term.trim()));
  }
  const startPoint =   ( page - 1 ) * limit;
  bookmarks = bookmarks.slice(startPoint, startPoint + limit);

  return bookmarks;
}


let getPersonalBookmarksForSearchedTerms = async function (nonSpecialSearchTerms, page, limit, userId, specialSearchFilters) {

  let filter = { };
  if(nonSpecialSearchTerms.length > 0) {
    const termsJoined = nonSpecialSearchTerms.join(' ');
    const termsQuery = escapeStringRegexp(termsJoined);
    filter.$text = {$search: termsQuery}
  }

  addSpecialSearchFiltersToMongoFilter(specialSearchFilters, filter);

  const userData = await User.findOne({userId: userId});
  filter.$or = [
    {userId: userId},
    {"_id": {$in: userData.favorites}}
  ]

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

  for ( const term of nonSpecialSearchTerms ) {
    bookmarks = bookmarks.filter(bookmark => bookmarksSearchHelper.bookmarkContainsSearchedTerm(bookmark, term.trim()));
  }
  const startPoint =  ( page - 1 ) * limit;
  bookmarks = bookmarks.slice(startPoint, startPoint + limit);

  return bookmarks;
}


let getPersonalBookmarksForSearchedTags = async function (searchedTags, page, limit, userId, specialSearchFilters) {
  let filter = {
    tags:
      {
        $all: searchedTags
      }
  }

  addSpecialSearchFiltersToMongoFilter(specialSearchFilters, filter);

  const userData = await User.findOne({
    userId: userId
  });
  filter.$or = [
    {userId: userId},
    {"_id": {$in: userData.favorites}}
  ]

  let bookmarks = await Bookmark.find(filter)
    .sort({createdAt: -1})
    .skip( ( page - 1 ) * limit)
    .limit(limit)
    .lean()
    .exec();

  return bookmarks;
}


module.exports = {
  findPersonalBookmarks: findPersonalBookmarks
}
