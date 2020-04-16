const Codelet = require('../../../model/codelet');
const escapeStringRegexp = require('escape-string-regexp');

const bookmarksSearchHelper = require('../../../common/bookmarks-search.helper');

let findPersonalCodelets = async function (query, page, limit, userId) {
  //split in text and tags
  const searchedTermsAndTags = bookmarksSearchHelper.splitSearchQuery(query);
  let searchedTerms = searchedTermsAndTags.terms;
  const searchedTags = searchedTermsAndTags.tags;
  let bookmarks = [];

  const {specialSearchFilters, nonSpecialSearchTerms} = bookmarksSearchHelper.extractSpecialSearchTerms(searchedTerms);

  if ( searchedTerms.length > 0 && searchedTags.length > 0 ) {
    bookmarks = await getPersonalCodeletsForTagsAndTerms(searchedTags, nonSpecialSearchTerms, page, limit, userId, specialSearchFilters);
  } else if ( searchedTerms.length > 0 ) {
    bookmarks = await getPersonalCodeletsForSearchedTerms(nonSpecialSearchTerms, page, limit, userId, specialSearchFilters);
  } else {
    bookmarks = await getPersonalCodeletsForSearchedTags(searchedTags, page, limit, userId, specialSearchFilters);
  }

  return bookmarks;
}

let getPersonalCodeletsForTagsAndTerms = async function (searchedTags, nonSpecialSearchTerms, page, limit, userId, specialSearchFilters) {
  let filter = {
    userId: userId,
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

  let codelets = await Codelet.find(
    filter,
    {
      score: {$meta: "textScore"}
    }
  )
  //.sort({createdAt: -1})
    .sort({score: {$meta: "textScore"}})
    .skip( ( page - 1 ) * limit)
    .limit(limit)
    .lean()
    .exec();

  return codelets;
}


let getPersonalCodeletsForSearchedTerms = async function (nonSpecialSearchTerms, page, limit, userId, specialSearchFilters) {

  let filter = {userId: userId };
  if(nonSpecialSearchTerms.length > 0) {
    const termsJoined = nonSpecialSearchTerms.join(' ');
    const termsQuery = escapeStringRegexp(termsJoined);
    filter.$text = {$search: termsQuery}
  }

  addSpecialSearchFiltersToMongoFilter(specialSearchFilters, filter);

  let codelets = await Codelet.find(
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

  return codelets;
}


let getPersonalCodeletsForSearchedTags = async function (searchedTags, page, limit, userId, specialSearchFilters) {
  let filter = {
    userId: userId,
    tags:
      {
        $all: searchedTags
      }
  }

  addSpecialSearchFiltersToMongoFilter(specialSearchFilters, filter);

  let codelets = await Codelet.find(filter)
    .sort({createdAt: -1})
    .skip( ( page - 1 ) * limit)
    .limit(limit)
    .lean()
    .exec();

  return codelets;
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

/**
 This method should be used only when the search should contain all the search terms and no rely on the text index
 for sorting
 Is to be integrated in the methods `getPersonalCodeletsForTagsAndTerms` and `getPersonalCodeletsForSearchedTerms` like the following

 for ( const term of nonSpecialSearchTerms ) {
    codelets = codelets.filter(codelet => codeletContainsSearchedTerm(codelet, term.trim()));
  }
 const startPoint =   ( page - 1 ) * limit;
 codelets = codelets.slice(startPoint, startPoint + limit);

 */
let codeletContainsSearchedTerm = function (codelet, searchedTerm) {
  // const escapedSearchPattern = '\\b' + this.escapeRegExp(searchedTerm.toLowerCase()) + '\\b'; word boundary was not enough, especially for special characters which can happen in coding
  // https://stackoverflow.com/questions/23458872/javascript-regex-word-boundary-b-issue
  const separatingChars = '\\s\\.,;#\\-\\/_\\[\\]\\(\\)\\*\\+';
  const escapedSearchPattern = `(^|[${separatingChars}])(${bookmarksSearchHelper.escapeRegExp(searchedTerm.toLowerCase())})(?=$|[${separatingChars}])`;
  const pattern = new RegExp(escapedSearchPattern);
  if ( (codelet.title && pattern.test(codelet.title.toLowerCase()))
    || (codelet.sourceUrl && pattern.test(codelet.sourceUrl.toLowerCase()))
  ) {
    return true;
  }

  if ( result ) {
    return true;
  } else {
    // if not found already look through the tags also
    codelet.tags.forEach(tag => {
      if ( pattern.test(tag.toLowerCase()) ) {
        return true;
      }
    });

    // look also through the snippet comments
    codelet.codeSnippets.forEach(codeSnippt => {
      if ( codeSnippt.comment && pattern.test(codeSnippt.comment.toLowerCase()) ) {
        return true;
      }
    });
  }

  return false;
}

module.exports = {
  findPersonalCodelets: findPersonalCodelets
}
