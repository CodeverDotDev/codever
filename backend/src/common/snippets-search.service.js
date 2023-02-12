const Snippet = require('../model/snippet');

const searchUtils = require('./search.utils');

let findSnippets = async function (userId, query, page, limit, searchInclude) {
  //split in text and tags
  const searchedTermsAndTags = searchUtils.splitSearchQuery(query);
  const searchedTerms = searchedTermsAndTags.terms;
  const searchedTags = searchedTermsAndTags.tags;

  const {specialSearchFilters, fulltextSearchTerms} = searchUtils.extractFulltextAndSpecialSearchTerms(searchedTerms);

  let filter = {}

  if ( searchedTags.length > 0 ) {
    filter.tags = {
      $all: searchedTags
    }
  }

  if ( userId ) {
    filter['userId'] = userId;
  } else {
    filter['public'] = true;
  }

  filter = searchUtils.includeFulltextSearchTermsInFilter(fulltextSearchTerms, filter, searchInclude);

  filter = addSpecialSearchFiltersToMongoFilter(specialSearchFilters, filter);

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

/**
 * You cannot have "private:only" and "userId" in the same search query,
 * to avoid searching some else's private resources
 */
let addSpecialSearchFiltersToMongoFilter = function (specialSearchFilters, filter) {
  let newFilter = {...filter};

  if ( specialSearchFilters.userId ) {
    newFilter.userId = specialSearchFilters.userId;
    newFilter.public = true;//you can only show public snippets from another user
  } else if ( specialSearchFilters.privateOnly ) { //
    newFilter.public = false;
  }

  if ( specialSearchFilters.site ) {
    newFilter.sourceUrl = new RegExp(specialSearchFilters.site, 'i');//TODO when performance becomes an issue extract domains from URLs and make a direct comparison with the domain
  }

  return newFilter;
};


module.exports = {
  findSnippets: findSnippets
}
