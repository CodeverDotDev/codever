const express = require('express');
const router = express.Router();

const NodeCache = require('../../cache-middleware');
const SnippetsSearchService = require('../../common/searching/snippets-search.service');
const PublicSnippetsService = require('./public-snippets.service');

const PaginationQueryParamsHelper = require('../../common/pagination-query-params-helper');

/**
 * Get snippet by shareableId
 */
router.get('/shared/:shareableId', async (request, response) => {
  const shareableId = request.params.shareableId;
  const sharedSnippet = await PublicSnippetsService.getSnippetByShareableId(
    shareableId
  );

  return response.json(sharedSnippet);
});

/**
 *  Returns the with query text
 */
router.get('/', async (request, response, next) => {
  const searchText = request.query.q;
  const searchInclude = request.query.include || 'all';
  const sort = request.query.sort;
  const { page, limit } = PaginationQueryParamsHelper.getPageAndLimit(request);

  if (searchText) {
    const snippets = await SnippetsSearchService.findPublicSnippets(
      searchText,
      page,
      limit,
      sort,
      searchInclude
    );
    response.send(snippets);
  } else {
    next();
  }
});

/**
 * When no filter send latest public bookmarks
 */
router.get('/', async (request, response) => {
  const { page, limit } = PaginationQueryParamsHelper.getPageAndLimit(request);
  const bookmarks = await PublicSnippetsService.getLatestPublicSnippets(
    page,
    limit
  );

  return response.send(bookmarks);
});

/**
 * Get most used public tags for snippets
 */
router.get(
  '/tags',
  NodeCache.cacheMiddleware(1440),
  async (request, response) => {
    const { limit } = PaginationQueryParamsHelper.getPageAndLimit(request);
    const mostUsedPublicTagsForSnippets =
      await PublicSnippetsService.getMostUsedPublicTagsForSnippets(limit);

    return response.send(mostUsedPublicTagsForSnippets);
  }
);

router.get('/tagged/:tag', async (request, response) => {
  const orderBy = request.query.orderBy;
  const { page, limit } = PaginationQueryParamsHelper.getPageAndLimit(request);

  const snippets = await PublicSnippetsService.getPublicSnippetsForTag(
    request.params.tag,
    orderBy,
    page,
    limit
  );

  return response.send(snippets);
});

/**
 *  GET snippet by id
 *  This needs to be the last call to avoid to "tagged"
 */

router.get('/:id', async function (request, response) {
  const bookmark = await PublicSnippetsService.getSnippetById(
    request.params.id
  );
  response.send(bookmark);
});

module.exports = router;
