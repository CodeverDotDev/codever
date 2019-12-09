var express = require('express');
var router = express.Router();
const constants = require('../../common/constants');

const ValidationError = require('../../error/validation.error');

const bookmarksSearchService = require('../../common/bookmarks-search.service');
const PublicBookmarksService = require('./public-bookmarks.service');

/**
 *  Returns the with query text
 */
router.get('/', async (request, response, next) => {
  const searchText = request.query.q;
  const limit = parseInt(request.query.limit);
  if (searchText) {
    const bookmarks = await bookmarksSearchService.findBookmarks(searchText, limit, constants.DOMAIN_PUBLIC, null);
    response.send(bookmarks);
  } else {
    next()
  }
});

/**
 * Get Bookmark by location
 */
router.get('/', async (request, response, next) => {
  const location = request.query.location;
  if (location) {
    const bookmark = await PublicBookmarksService.getBookmarkByLocation(location);

    return response.send(bookmark);
  } else {
    next()
  }
});

/**
 * When no filter send latest public bookmarks
 */
router.get('/', async (request, response) => {
  const bookmarks = await PublicBookmarksService.getLatestBookmarks();

  return response.send(bookmarks);
});

router.get('/tagged/:tag', async (request, response) => {
  const orderByFilter = request.query.orderBy === 'STARS' ? {likes: -1} : {createdAt: -1};
  const bookmarks = await PublicBookmarksService.getBookmarksForTag(request.params.tag, orderByFilter);

  return response.send(bookmarks);
});

/* GET title of bookmark given its url - might be moved to front-end */
router.get('/scrape', async function (request, response, next) {
  const location = request.query.location;
  if (location) {
    const webpageData = await PublicBookmarksService.getScrapedDataForLocation(location);

    return response.send(webpageData);
  } else {
    next();
  }
});

/* GET youtube video data */
router.get('/scrape', async function (request, response, next) {
  const youtubeVideoId = request.query.youtubeVideoId;
  if (youtubeVideoId) {
    const webpageData = await PublicBookmarksService.getYoutubeVideoData(youtubeVideoId)

    return response.send(webpageData);
  } else {
    next();
  }
});

/* GET stackoverflow question data */
router.get('/scrape', async function (request, response, next) {
  const stackoverflowQuestionId = request.query.stackoverflowQuestionId;
  if (stackoverflowQuestionId) {
    const webpageData = await PublicBookmarksService.getStackoverflowQuestionData(stackoverflowQuestionId)

    return response.send(webpageData);
  } else {
    next();
  }
});

/* GET title of bookmark given its url */
router.get('/scrape', async function () {
  throw new ValidationError('Missing parameters - url or youtubeVideoId',
    ['You need to provide the url to scrape for or the youtubeVideoId']);
});

/**
 *  GET bookmark by id.
 *  This needs to be the last call to avoid to "tagged" and "scrape" endpoints, which throw then errors
 */

router.get('/:id', async function (request, response) {
  const bookmark = await PublicBookmarksService.getBookmarkById(request.params.id);
  response.send(bookmark);
});


module.exports = router;
