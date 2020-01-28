const Bookmark = require('../../model/bookmark');
const escapeStringRegexp = require('escape-string-regexp');
const bookmarksSearchHelper = require('../../common/bookmarks-search.helper');

let findPublicBookmarks = async function (query, limit) {
  //split in text and tags
  const searchedTermsAndTags = bookmarksSearchHelper.splitSearchQuery(query);
  const searchedTerms = searchedTermsAndTags.terms;
  const searchedTags = searchedTermsAndTags.tags;
  let bookmarks = [];
  const regex = /user:\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/g;

  let userId = null;
  let filteredTerms = [];
  for ( let i = 0; i < searchedTerms.length; i++ ) {
    if ( searchedTerms[i].match(regex) ) {
      userId = searchedTerms[i].split(':')[1];
    } else {
      filteredTerms.push(searchedTerms[i]);
    }
  }

  if ( filteredTerms.length > 0 && searchedTags.length > 0 ) {
    bookmarks = await getPublicBookmarksForTagsAndTerms(searchedTags, filteredTerms, limit, userId);
  } else if ( filteredTerms.length > 0 ) {
    bookmarks = await getPublicBookmarksForSearchedTerms(filteredTerms, limit, userId);
  } else if ( searchedTags.length > 0 ) {
    bookmarks = await getPublicBookmarksForSearchedTags(searchedTags, limit, userId);
  } else if(userId) {
    bookmarks = await getPublicBookmarksForUser(limit, userId);
  }

  return bookmarks;
}


let getPublicBookmarksForTagsAndTerms = async function (searchedTags, searchedTerms, limit, userId) {
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

  if ( userId ) {
    filter.userId = userId;
  }

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

let getPublicBookmarksForSearchedTerms = async function (searchedTerms, limit, userId) {

  const termsJoined = searchedTerms.join(' ');
  const termsQuery = escapeStringRegexp(termsJoined);
  let filter = {
    shared: true,
    $text: {$search: termsQuery}
  }

  if ( userId ) {
    filter.userId = userId;
  }

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

let getPublicBookmarksForSearchedTags = async function (searchedTags, limit, userId) {
  let filter = {
    shared: true,
    tags:
      {
        $all: searchedTags
      }
  }

  if ( userId ) {
    filter.userId = userId;
  }

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
