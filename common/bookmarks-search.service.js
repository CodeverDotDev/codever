//showdown converter - https://github.com/showdownjs/showdown
const showdown = require('showdown'),
  converter = new showdown.Converter();

const Bookmark = require('../models/bookmark');
const escapeStringRegexp = require('escape-string-regexp');
const constants = require('./constants');

let findBookmarks = async function (query, limit, lang, domain, userId) {
  //split in text and tags
  const searchedTermsAndTags = splitSearchQuery(query);
  const searchedTerms = searchedTermsAndTags[0];
  const searchedTags = searchedTermsAndTags[1];
  let bookmarks = [];

  if ( searchedTerms.length > 0 && searchedTags.length > 0 ) {
    bookmarks = await getBookmarksForTagsAndTerms(searchedTags, searchedTerms, limit, domain, userId);
  } else if ( searchedTerms.length > 0 ) {
    bookmarks = await getBookmarksForSearchedTerms(searchedTerms, limit, domain, userId);
  } else {
    bookmarks = await getBookmarksForSearchedTags(searchedTags, limit, domain, userId);
  }
  if ( lang && lang !== 'all' ) {
    bookmarks = bookmarks.filter(x => x.language === lang);
  }

  return bookmarks;
}

let splitSearchQuery = function (query) {

  const result = [[], []];

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

  result[0] = terms;
  result[1] = tags;

  return result;
}

let getBookmarksForTagsAndTerms = async function (searchedTags, searchedTerms, limit, domain, userId) {
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
  if ( domain === constants.DOMAIN_PUBLIC ) {
    filter.shared = true;
  }

  if ( domain === constants.DOMAIN_PERSONAL ) {
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

let getBookmarksForSearchedTerms = async function (searchedTerms, limit, domain, userId) {

  const termsJoined = searchedTerms.join(' ');
  const termsQuery = escapeStringRegexp(termsJoined);
  let filter = {
    $text: {$search: termsQuery}
  }
  if ( domain === constants.DOMAIN_PUBLIC ) {
    filter.shared = true;
  }

  if ( domain === constants.DOMAIN_PERSONAL ) {
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

let getBookmarksForSearchedTags = async function (searchedTags, limit, domain, userId) {
  let filter = {
    tags:
      {
        $all: searchedTags
      }
  }
  if ( domain === constants.DOMAIN_PUBLIC ) {
    filter.shared = true;
  }

  if ( domain === constants.DOMAIN_PERSONAL ) {
    filter.userId = userId;
  }

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
  findBookmarks: findBookmarks
}
