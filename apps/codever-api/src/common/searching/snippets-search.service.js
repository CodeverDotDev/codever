const Snippet = require('../../model/snippet');

const searchUtils = require('./utils/search.utils');
const { OrderBy } = require('./constant/orderby.constant');
const { DocType } = require('../constants');

let findPublicSnippets = async function (query, page, limit, searchInclude) {
  return findSnippets(true, null, query, page, limit, searchInclude);
};

let findPersonalSnippets = async function (
  userId,
  query,
  page,
  limit,
  searchInclude
) {
  return findSnippets(false, userId, query, page, limit, searchInclude);
};

let findSnippets = async function (
  isPublic,
  userId,
  query,
  page,
  limit,
  searchInclude,
  sort = 'textScore'
) {
  const { filter, sortBy } = searchUtils.generateSearchFilterAndSortBy(
    DocType.SNIPPET,
    isPublic,
    userId,
    query,
    searchInclude,
    sort
  );

  const snippets = await Snippet.find(filter, {
    score: { $meta: OrderBy.TEXT_SCORE },
  })
    .sort(sortBy)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
    .exec();

  return snippets;
};

module.exports = {
  findPublicSnippets: findPublicSnippets,
  findPersonalSnippets: findPersonalSnippets,
  findSnippets: findSnippets,
};
