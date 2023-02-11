const Bookmark = require('../../../model/bookmark');
const searchUtils = require('../../../common/search.utils');

let findPersonalBookmarks = async function (userId, query, page, limit, searchInclude) {
  //split in text and tags
  const searchedTermsAndTags = searchUtils.splitSearchQuery(query);
  let searchedTerms = searchedTermsAndTags.terms;
  const searchedTags = searchedTermsAndTags.tags;
  let bookmarks = [];

  const {specialSearchFilters, nonSpecialSearchTerms} = searchUtils.extractSpecialSearchTerms(searchedTerms);

  if ( searchedTerms.length > 0 && searchedTags.length > 0 ) {
    bookmarks = await getPersonalBookmarksForTagsAndTerms( userId, searchedTags, nonSpecialSearchTerms, page, limit, specialSearchFilters, searchInclude);
  } else if ( searchedTerms.length > 0 ) {
    bookmarks = await getPersonalBookmarksForSearchedTerms(userId, nonSpecialSearchTerms, page, limit, specialSearchFilters, searchInclude);
  } else {
    bookmarks = await getPersonalBookmarksForSearchedTags(userId, searchedTags, page, limit, specialSearchFilters);
  }

  return bookmarks;
}

let getPersonalBookmarksForTagsAndTerms = async function (userId, searchedTags, nonSpecialSearchTerms, page, limit, specialSearchFilters, searchInclude) {
  let filter = {
    userId: userId,
    tags:
      {
        $all: searchedTags
      }
  }

  if ( nonSpecialSearchTerms.length > 0 ) {
    if(searchInclude === 'any') {
      filter.$text = {$search: nonSpecialSearchTerms.join(' ')}
    } else {
      filter.$text = {$search: searchUtils.generateFullSearchText(nonSpecialSearchTerms)};
    }
  }

  addSpecialSearchFiltersToMongoFilter(specialSearchFilters, filter);

  let bookmarks = await Bookmark.find(
    filter,
    {
      score: {$meta: "textScore"}
    }
  )
    .sort({score: {$meta: "textScore"}})
    .skip( ( page - 1 ) * limit)
    .limit(limit)
    .lean()
    .exec();

  return bookmarks;
}


let getPersonalBookmarksForSearchedTerms = async function ( userId, nonSpecialSearchTerms, page, limit,specialSearchFilters, searchInclude) {

  let filter = {userId: userId };
  if ( nonSpecialSearchTerms.length > 0 ) {
    if(searchInclude === 'any') {
      filter.$text = {$search: nonSpecialSearchTerms.join(' ')}
    } else {
      filter.$text = {$search: searchUtils.generateFullSearchText(nonSpecialSearchTerms)};
    }
  }
  addSpecialSearchFiltersToMongoFilter(specialSearchFilters, filter);

  let bookmarks = await Bookmark.find(
    filter,
    {
      score: {$meta: "textScore"}
    }
  )
    .sort({score: {$meta: "textScore"}})
    .skip( ( page - 1 ) * limit)
    .limit(limit)
    .lean()
    .exec();

  return bookmarks;
}


let getPersonalBookmarksForSearchedTags = async function (userId, searchedTags, page, limit, specialSearchFilters) {
  let filter = {
    userId: userId,
    tags:
      {
        $all: searchedTags
      }
  }

  addSpecialSearchFiltersToMongoFilter(specialSearchFilters, filter);

  let bookmarks = await Bookmark.find(filter)
    .sort({createdAt: -1})
    .skip( ( page - 1 ) * limit)
    .limit(limit)
    .lean()
    .exec();

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

module.exports = {
  findPersonalBookmarks: findPersonalBookmarks
}
