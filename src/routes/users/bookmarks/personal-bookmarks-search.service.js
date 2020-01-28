const Bookmark = require('../../../model/bookmark');
const User = require('../../../model/user');
const escapeStringRegexp = require('escape-string-regexp');

const bookmarksSearchHelper = require('../../../common/bookmarks-search.helper');

let findPersonalBookmarks = async function (query, limit, userId) {
  //split in text and tags
  const searchedTermsAndTags = bookmarksSearchHelper.splitSearchQuery(query);
  let searchedTerms = searchedTermsAndTags.terms;
  const searchedTags = searchedTermsAndTags.tags;
  let bookmarks = [];

  let privateOnly = false;
  const privateOnlyIndex = searchedTerms && searchedTerms.indexOf('private:only');
  if ( privateOnlyIndex > -1 ) {
    privateOnly = true;
    searchedTerms.splice(privateOnlyIndex, 1);
  }

  if ( searchedTerms.length > 0 && searchedTags.length > 0 ) {
    bookmarks = await getPersonalBookmarksForTagsAndTerms(searchedTags, searchedTerms, limit, userId, privateOnly);
  } else if ( searchedTerms.length > 0 ) {
    bookmarks = await getPersonalBookmarksForSearchedTerms(searchedTerms, limit, userId, privateOnly);
  } else {
    bookmarks = await getPersonalBookmarksForSearchedTags(searchedTags, limit, userId, privateOnly);
  }

  return bookmarks;
}

let getPersonalBookmarksForTagsAndTerms = async function (searchedTags, searchedTerms, limit, userId, privateOnly) {
  let filter = {
    tags:
      {
        $all: searchedTags
      },
    $text:
      {
        $search: searchedTerms.join(' ')
      }
  }

  if ( privateOnly ) {
    filter.shared = false;
  }

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

  for ( const term of searchedTerms ) {
    bookmarks = bookmarks.filter(bookmark => bookmarksSearchHelper.bookmarkContainsSearchedTerm(bookmark, term.trim()));
  }
  bookmarks = bookmarks.slice(0, limit);

  return bookmarks;
}


let getPersonalBookmarksForSearchedTerms = async function (searchedTerms, limit, userId, privateOnly) {

  const termsJoined = searchedTerms.join(' ');
  const termsQuery = escapeStringRegexp(termsJoined);
  let filter = {
    $text: {$search: termsQuery}
  }
  if ( privateOnly ) {
    filter.shared = false;
  }
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

  for ( const term of searchedTerms ) {
    bookmarks = bookmarks.filter(bookmark => bookmarksSearchHelper.bookmarkContainsSearchedTerm(bookmark, term.trim()));
  }
  bookmarks = bookmarks.slice(0, limit);

  return bookmarks;
}


let getPersonalBookmarksForSearchedTags = async function (searchedTags, limit, userId, privateOnly) {
  let filter = {
    tags:
      {
        $all: searchedTags
      }
  }
  if ( privateOnly ) {
    filter.shared = false;
  }
  const userData = await User.findOne({
    userId: userId
  });
  filter.$or = [
    {userId: userId},
    {"_id": {$in: userData.favorites}}
  ]

  let bookmarks = await Bookmark.find(filter)
    .sort({createdAt: -1})
    .limit(limit)
    .lean()
    .exec();

  return bookmarks;
}



module.exports = {
  findPersonalBookmarks: findPersonalBookmarks
}
