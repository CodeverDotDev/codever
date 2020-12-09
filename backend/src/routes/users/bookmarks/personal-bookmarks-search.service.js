const Bookmark = require('../../../model/bookmark');
const bookmarksSearchHelper = require('../../../common/bookmarks-search.helper');

let findPersonalBookmarks = async function (query, page, limit, userId, searchInclude) {
  //split in text and tags
  const searchedTermsAndTags = bookmarksSearchHelper.splitSearchQuery(query);
  let searchedTerms = searchedTermsAndTags.terms;
  const searchedTags = searchedTermsAndTags.tags;
  let bookmarks = [];

  const {specialSearchFilters, nonSpecialSearchTerms} = bookmarksSearchHelper.extractSpecialSearchTerms(searchedTerms);

  if ( searchedTerms.length > 0 && searchedTags.length > 0 ) {
    bookmarks = await getPersonalBookmarksForTagsAndTerms(searchedTags, nonSpecialSearchTerms, page, limit, userId, specialSearchFilters, searchInclude);
  } else if ( searchedTerms.length > 0 ) {
    bookmarks = await getPersonalBookmarksForSearchedTerms(nonSpecialSearchTerms, page, limit, userId, specialSearchFilters, searchInclude);
  } else {
    bookmarks = await getPersonalBookmarksForSearchedTags(searchedTags, page, limit, userId, specialSearchFilters);
  }

  return bookmarks;
}

let getPersonalBookmarksForTagsAndTerms = async function (searchedTags, nonSpecialSearchTerms, page, limit, userId, specialSearchFilters, searchInclude) {
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
      filter.$text = {$search: bookmarksSearchHelper.generateFullSearchText(nonSpecialSearchTerms)};
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


let getPersonalBookmarksForSearchedTerms = async function (nonSpecialSearchTerms, page, limit, userId, specialSearchFilters, searchInclude) {

  let filter = {userId: userId };
  if ( nonSpecialSearchTerms.length > 0 ) {
    if(searchInclude === 'any') {
      filter.$text = {$search: nonSpecialSearchTerms.join(' ')}
    } else {
      filter.$text = {$search: bookmarksSearchHelper.generateFullSearchText(nonSpecialSearchTerms)};
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


let getPersonalBookmarksForSearchedTags = async function (searchedTags, page, limit, userId, specialSearchFilters) {
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
