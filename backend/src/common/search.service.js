const Snippet = require('../model/snippet');

const searchUtils = require('./search.utils');

let findItems = async function (type, isPublic, userId, query, page, limit, searchInclude) {
  //split in text and tags
  const searchedTermsAndTags = searchUtils.splitSearchQuery(query);
  let searchedTerms = searchedTermsAndTags.terms;
  const searchedTags = searchedTermsAndTags.tags;
  let snippets = [];

  const {specialSearchTerms, fulltextSearchTerms} = searchUtils.extractFulltextAndSpecialSearchTerms(searchedTerms);

  if ( searchedTerms.length > 0 && searchedTags.length > 0 ) {
    snippets = await getItemsForTagsAndTerms(type, isPublic, userId, searchedTags, fulltextSearchTerms, page, limit, specialSearchTerms, searchInclude);
  } else if ( searchedTerms.length > 0 ) {
    snippets = await getItemsForSearchedTerms(type, isPublic, userId, fulltextSearchTerms, page, limit, specialSearchTerms, searchInclude);
  } else {
    snippets = await getItemsForSearchedTags(type, isPublic, userId, searchedTags, page, limit, specialSearchTerms);
  }

  return snippets;
}

let getItemsForTagsAndTerms = async function (type, isPublic, userId, searchedTags, fulltextSearchTerms, page, limit, specialSearchFilters, searchInclude) {
  let filter = {
    tags:
      {
        $all: searchedTags
      }
  }
  if ( userId ){
    filter['userId'] = userId;
  }
  if (isPublic) {
    filter['public'] = true;
  }

  filter = searchUtils.setFulltextSearchTermsFilter(fulltextSearchTerms, filter);

  setSpecialSearchTermsFilter(specialSearchFilters, filter);

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


let getItemsForSearchedTerms = async function (type, isPublic, userId, fulltextSearchTerms, page, limit, specialSearchFilters, searchInclude) {

  let filter = {};
  if ( userId ){
    filter['userId'] = userId;
  } else {
    filter['public'] = true;
  }

  if ( fulltextSearchTerms.length > 0 ) {
    if ( searchInclude === 'any' ) {
      filter.$text = {$search: fulltextSearchTerms.join(' ')}
    } else {
      filter.$text = {$search: searchUtils.generateFullSearchText(fulltextSearchTerms)};
    }
  }

  setSpecialSearchTermsFilter(specialSearchFilters, filter);

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


let getItemsForSearchedTags = async function (type, isPublic, userId, searchedTags, page, limit, specialSearchFilters) {
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

  setSpecialSearchTermsFilter(specialSearchFilters, filter);

  let snippets = await Snippet.find(filter)
    .sort({createdAt: -1})
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
    .exec();

  return snippets;
}

let setSpecialSearchTermsFilter = function (specialSearchFilters, filter) {
  if ( specialSearchFilters.userId ) {
    filter.userId = specialSearchFilters.userId;
  } else if ( specialSearchFilters.privateOnly ) {
    filter.public = false;
  }

  if ( specialSearchFilters.site ) {
    filter.sourceUrl = new RegExp(specialSearchFilters.site, 'i'); //TODO when performance becomes an issue extract domains from URLs and make a direct comparison with the domain
  }
};


module.exports = {
  findSnippets: findItems
}
