const Bookmark = require('../model/bookmark');
const User = require('../model/user');
const escapeStringRegexp = require('escape-string-regexp');

let findPersonalBookmarks = async function (query, limit, userId) {
  //split in text and tags
  const searchedTermsAndTags = splitSearchQuery(query);
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

let findPublicBookmarks = async function (query, limit) {
  //split in text and tags
  const searchedTermsAndTags = splitSearchQuery(query);
  const searchedTerms = searchedTermsAndTags.terms;
  const searchedTags = searchedTermsAndTags.tags;
  let bookmarks = [];
  const regex = /user:\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/g;

  let userId = null;
  let filteredTerms = [];
  for(let i = 0; i < searchedTerms.length; i++){
    if(searchedTerms[i].match(regex)){
      userId = searchedTerms[i].split(':')[1];
    } else {
      filteredTerms.push(searchedTerms[i]);
    }
  }

  if ( filteredTerms.length > 0 && searchedTags.length > 0 ) {
    bookmarks = await getPublicBookmarksForTagsAndTerms(searchedTags, filteredTerms, limit, userId);
  } else if ( filteredTerms.length > 0 ) {
    bookmarks = await getPublicBookmarksForSearchedTerms(filteredTerms, limit, userId);
  } else {
    bookmarks = await getPublicBookmarksForSearchedTags(searchedTags, limit, userId);
  }

  return bookmarks;
}

let splitSearchQuery = function (query) {

  const result = {};

  const terms = [];
  let term = '';
  const tags = [];
  let tag = '';

  let isInsideTerm = false;
  let isInsideTag = false;


  for ( let i = 0; i < query.length; i++ ) {
    const currentCharacter = query[i];
    if ( currentCharacter === ' ' ) {
      if ( !isInsideTag ) {
        if ( !isInsideTerm ) {
          continue;
        } else {
          terms.push(term);
          isInsideTerm = false;
          term = '';
        }
      } else {
        tag += ' ';
      }
    } else if ( currentCharacter === '[' ) {
      if ( isInsideTag ) {
        tags.push(tag.trim());
        tag = '';
      } else {
        isInsideTag = true;
      }
    } else if ( currentCharacter === ']' ) {
      if ( isInsideTag ) {
        isInsideTag = false;
        tags.push(tag.trim());
        tag = '';
      }
    } else {
      if ( isInsideTag ) {
        tag += currentCharacter;
      } else {
        isInsideTerm = true;
        term += currentCharacter;
      }
    }
  }

  if ( tag.length > 0 ) {
    tags.push(tag.trim());
  }

  if ( term.length > 0 ) {
    terms.push(term);
  }

  result.terms = terms;
  result.tags = tags;

  return result;
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
    bookmarks = bookmarks.filter(x => bookmarkContainsSearchedTerm(x, term.trim()));
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
    bookmarks = bookmarks.filter(x => bookmarkContainsSearchedTerm(x, term.trim()));
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
    bookmarks = bookmarks.filter(x => bookmarkContainsSearchedTerm(x, term.trim()));
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
    bookmarks = bookmarks.filter(x => bookmarkContainsSearchedTerm(x, term.trim()));
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


let bookmarkContainsSearchedTerm = function (bookmark, searchedTerm) {
  let result = false;
  // const escapedSearchPattern = '\\b' + this.escapeRegExp(searchedTerm.toLowerCase()) + '\\b'; word boundary was not enough, especially for special characters which can happen in coding
  // https://stackoverflow.com/questions/23458872/javascript-regex-word-boundary-b-issue
  const separatingChars = '\\s\\.,;#\\-\\/_\\[\\]\\(\\)\\*\\+';
  const escapedSearchPattern = `(^|[${separatingChars}])(${escapeRegExp(searchedTerm.toLowerCase())})(?=$|[${separatingChars}])`;
  const pattern = new RegExp(escapedSearchPattern);
  if ( (bookmark.name && pattern.test(bookmark.name.toLowerCase()))
    || (bookmark.location && pattern.test(bookmark.location.toLowerCase()))
    || (bookmark.description && pattern.test(bookmark.description.toLowerCase()))
    || (bookmark.githubURL && pattern.test(bookmark.githubURL.toLowerCase()))
  ) {
    result = true;
  }

  if ( result ) {
    return true;
  } else {
    // if not found already look through the tags also
    bookmark.tags.forEach(tag => {
      if ( pattern.test(tag.toLowerCase()) ) {
        result = true;
      }
    });
  }

  return result;
}

function escapeRegExp(str) {
  const specials = [
      // order matters for these
      '-'
      , '['
      , ']'
      // order doesn't matter for any of these
      , '/'
      , '{'
      , '}'
      , '('
      , ')'
      , '*'
      , '+'
      , '?'
      , '.'
      , '\\'
      , '^'
      , '$'
      , '|'
    ],
    regex = RegExp('[' + specials.join('\\') + ']', 'g');
  return str.replace(regex, '\\$&'); // $& means the whole matched string
}

module.exports = {
  findPersonalBookmarks: findPersonalBookmarks,
  findPublicBookmarks: findPublicBookmarks
}
