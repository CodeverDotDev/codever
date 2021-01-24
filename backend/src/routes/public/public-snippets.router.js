const express = require('express');
const router = express.Router();

const SnippetsSearchService = require('../../common/snippets-search.service');
const PublicSnippetsService = require('./public-snippets.service');

const PaginationQueryParamsHelper = require('../../common/pagination-query-params-helper');

/**
 *  Returns the with query text
 */
router.get('/', async (request, response, next) => {
  const searchText = request.query.q;
  const searchInclude = request.query.include || 'all';
  const sort = request.query.sort;
  const {page, limit} = PaginationQueryParamsHelper.getPageAndLimit(request);

  if (searchText) {
    const snippets = await SnippetsSearchService.findSnippets(null, searchText, page, limit, sort, searchInclude);
    response.send(snippets);
  } else {
    next()
  }
});

/**
 * When no filter send latest public bookmarks
 */
router.get('/', async (request, response) => {

  const {page, limit} = PaginationQueryParamsHelper.getPageAndLimit(request);
  const bookmarks = await PublicSnippetsService.getLatestPublicSnippets(page, limit);

  return response.send(bookmarks);
});

/**
 *  GET snippet by id
 *  This needs to be the last call to avoid to "tagged"
 */

router.get('/:id', async function (request, response) {
  const bookmark = await PublicSnippetsService.getSnippetById(request.params.id);
  response.send(bookmark);
});


module.exports = router;
