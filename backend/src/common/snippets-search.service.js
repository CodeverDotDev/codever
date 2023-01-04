const Snippet = require('../model/snippet');

const bookmarksSearchHelper = require('./bookmarks-search.helper');

let findSnippets = async function (userId, query, page, limit, searchInclude) {
  //split in text and tags
  const searchedTermsAndTags = bookmarksSearchHelper.splitSearchQuery(query);
  let searchedTerms = searchedTermsAndTags.terms;
  const searchedTags = searchedTermsAndTags.tags;
  let snippets = [];

  const {specialSearchFilters, nonSpecialSearchTerms} = bookmarksSearchHelper.extractSpecialSearchTerms(searchedTerms);

  if ( searchedTerms.length > 0 && searchedTags.length > 0 ) {
    snippets = await getSnippetsForTagsAndTerms(userId, searchedTags, nonSpecialSearchTerms, page, limit, specialSearchFilters, searchInclude);
  } else if ( searchedTerms.length > 0 ) {
    snippets = await getSnippetsForSearchedTerms(userId, nonSpecialSearchTerms, page, limit, specialSearchFilters, searchInclude);
  } else {
    snippets = await getSnippetsForSearchedTags(userId, searchedTags, page, limit, specialSearchFilters);
  }

  return snippets;
}

let getSnippetsForTagsAndTerms = async function (userId, searchedTags, nonSpecialSearchTerms, page, limit, specialSearchFilters, searchInclude) {
  let filter = {
    tags:
      {
        $all: searchedTags
      }
  }
  if ( userId ){
    filter['userId'] = userId;
  } else {
    filter['public'] = true;
  }

  if ( nonSpecialSearchTerms.length > 0 ) {
    if ( searchInclude === 'any' ) {
      filter.$text = {$search: nonSpecialSearchTerms.join(' ')}
    } else {
      filter.$text = {$search: bookmarksSearchHelper.generateFullSearchText(nonSpecialSearchTerms)};
    }
  }

  addSpecialSearchFiltersToMongoFilter(specialSearchFilters, filter);

  let snippets = await Snippet.find(
    filter,
    {
      score: {$meta: "textScore"}
    }
  )
    .sort({score: {$meta: "textScore"}})
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
    .exec();

  return snippets;
}


let getSnippetsForSearchedTerms = async function (userId, nonSpecialSearchTerms, page, limit, specialSearchFilters, searchInclude) {

  let filter = {};
  if ( userId ){
    filter['userId'] = userId;
  } else {
    filter['public'] = true;
  }

  if ( nonSpecialSearchTerms.length > 0 ) {
    if ( searchInclude === 'any' ) {
      filter.$text = {$search: nonSpecialSearchTerms.join(' ')}
    } else {
      filter.$text = {$search: bookmarksSearchHelper.generateFullSearchText(nonSpecialSearchTerms)};
    }
  }

  addSpecialSearchFiltersToMongoFilter(specialSearchFilters, filter);

  let snippets = await Snippet.find(
    filter,
    {
      score: {$meta: "textScore"}
    }
  )
    .sort({score: {$meta: "textScore"}})
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
    .exec();

  return snippets;
}


let getSnippetsForSearchedTags = async function (userId, searchedTags, page, limit, specialSearchFilters) {
  let filter = {
    tags:
      {
        $all: searchedTags
      }
  }
  if ( userId ) {
    filter['userId'] = userId;
  } else {
    filter['public'] = true;
  }

  addSpecialSearchFiltersToMongoFilter(specialSearchFilters, filter);

  let snippets = await Snippet.find(filter)
    .sort({createdAt: -1})
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
    .exec();

  return snippets;
}

let addSpecialSearchFiltersToMongoFilter = function (specialSearchFilters, filter) {
  if ( specialSearchFilters.userId ) {
    filter.userId = specialSearchFilters.userId;
    filter.public = true;
  } else if ( specialSearchFilters.privateOnly ) {
    filter.public = false;
  }

  if ( specialSearchFilters.site ) {
    filter.sourceUrl = new RegExp(specialSearchFilters.site, 'i'); //TODO when performance becomes an issue extract domains from URLs and make a direct comparison with the domain
  }
};


module.exports = {
  findSnippets: findSnippets
}
