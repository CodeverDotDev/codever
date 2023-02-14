const Snippet = require('../model/snippet');

const searchUtils = require('./search.utils');

let findPublicSnippets = async function (query, page, limit, searchInclude) {
  return findSnippets(true, null, query, page, limit, searchInclude)
}

let findPersonalSnippets = async function (userId, query, page, limit, searchInclude) {
  return findSnippets(false, userId, query, page, limit, searchInclude)
}

let findSnippets = async function (isPublic, userId, query, page, limit, searchInclude) {
  //split in text and tags
  const searchTermsAndTags = searchUtils.splitSearchQuery(query);
  const searchTerms = searchTermsAndTags.terms;
  const searchTags = searchTermsAndTags.tags;

  const {specialSearchTerms, fulltextSearchTerms} = searchUtils.extractFulltextAndSpecialSearchTerms(searchTerms);

  let filter = {}
  filter = searchUtils.setPublicOrPersonalFilter(isPublic, filter, userId);
  filter = searchUtils.setTagsToFilter(searchTags, filter);
  filter = searchUtils.setFulltextSearchTermsFilter(fulltextSearchTerms, filter, searchInclude);
  filter = searchUtils.setSpecialSearchTermsFilter(isPublic, userId, specialSearchTerms, filter);

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

module.exports = {
  findPublicSnippets: findPublicSnippets,
  findPersonalSnippets: findPersonalSnippets,
  findSnippets: findSnippets
}
