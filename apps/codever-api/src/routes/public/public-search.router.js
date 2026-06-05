const express = require('express');
const router = express.Router();

const PublicSearchService = require('./public-search.service');
const PaginationQueryParamsHelper = require('../../common/pagination-query-params-helper');

/**
 * GET combined public search results (bookmarks + notes)
 */
router.get('/', async (request, response) => {
  const searchText = request.query.q;
  const searchInclude = request.query.include || 'all';
  const { page, limit } = PaginationQueryParamsHelper.getPageAndLimit(request);

  if (searchText) {
    const searchResults = await PublicSearchService.getPublicSearchResults(
      searchText,
      page,
      limit,
      searchInclude
    );
    return response.send(searchResults);
  } else {
    return response.send([]);
  }
});

module.exports = router;

