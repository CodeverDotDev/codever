const express = require('express');
const personalBookmarksRouter = express.Router({mergeParams: true});
const Keycloak = require('keycloak-connect');

const bookmarkRequestMapper = require('../../../common/mappers/bookmark-request.mapper');
const personalBookmarksSearchService = require('../../../common/searching/bookmarks-search.service');
const PersonalBookmarksService = require('./personal-bookmarks.service');
const UserIdValidator = require('../userid.validator');
const PaginationQueryParamsHelper = require('../../../common/pagination-query-params-helper');

const ValidationError = require('../../../error/validation.error');

const common = require('../../../common/config');
const config = common.config();

const HttpStatus = require('http-status-codes/index');

const NodeCache = require('../../../cache-middleware');

//add keycloak middleware
const keycloak = new Keycloak({scope: 'openid'}, config.keycloak);
personalBookmarksRouter.use(keycloak.middleware());


/**
 * CREATE bookmark for user
 */
personalBookmarksRouter.post('/', keycloak.protect(), async (request, response) => {

  UserIdValidator.validateUserId(request);
  const bookmark = bookmarkRequestMapper.toBookmark(request);
  let newBookmark = await PersonalBookmarksService.createBookmark(request.params.userId, bookmark);

  response
    .set('Location', `${config.basicApiUrl}/personal/users/${request.params.userId}/bookmarks/${newBookmark.id}`)
    .status(HttpStatus.CREATED)
    .send({response: 'Bookmark created for userId ' + request.params.userId});

});


/* GET bookmarks of user */
personalBookmarksRouter.get('/', keycloak.protect(), async (request, response, next) => {
  UserIdValidator.validateUserId(request);

  const searchText = request.query.q;
  const {page, limit} = PaginationQueryParamsHelper.getPageAndLimit(request);
  const searchInclude = request.query.include;
  if ( searchText ) {
    const bookmarks = await personalBookmarksSearchService.findPersonalBookmarks(
      request.params.userId, searchText, page, limit, searchInclude);
    return response.send(bookmarks);
  } else {
    next();
  }
});

/* GET bookmark of user by location*/
personalBookmarksRouter.get('/', keycloak.protect(), async (request, response, next) => {
  if ( request.query.location ) {
    const decodedUrl = decodeURIComponent(request.query.location);
    const bookmark = await PersonalBookmarksService.getPersonalBookmarkByLocation(request.params.userId, decodedUrl);
    return response.send(bookmark);
  } else {
    next();
  }
});

/* GET bookmark of user */
personalBookmarksRouter.get('/', keycloak.protect(), async (request, response) => {
  let bookmarks;
  const orderBy = request.query.orderBy;
  const {page, limit} = PaginationQueryParamsHelper.getPageAndLimit(request);
  switch (orderBy) {
    case 'MOST_LIKES':
      bookmarks = await PersonalBookmarksService.getMostLikedBookmarks(request.params.userId, page, limit);
      break;
    case 'LAST_CREATED':
      bookmarks = await PersonalBookmarksService.getLastCreatedBookmarks(request.params.userId, page, limit);
      break;
    case 'MOST_USED':
      bookmarks = await PersonalBookmarksService.getMostUsedBookmarks(request.params.userId);
      break;
    default:
      bookmarks = await PersonalBookmarksService.getAllMyBookmarks(request.params.userId);
  }

  return response.send(bookmarks);
});

/* GET suggested tags used by user */
personalBookmarksRouter.get('/suggested-tags', keycloak.protect(), async (request, response) => {
  UserIdValidator.validateUserId(request);
  const tags = await PersonalBookmarksService.getSuggestedTagsForUser(request.params.userId);

  response.send(tags);
});

personalBookmarksRouter.get('/tags', keycloak.protect(), NodeCache.cacheMiddleware(240), async (request, response) => {
  UserIdValidator.validateUserId(request);
  const tags = await PersonalBookmarksService.getUserTagsAggregated(request.params.userId);

  response.send(tags);
});


/* GET bookmark of user */
personalBookmarksRouter.get('/:bookmarkId', keycloak.protect(), async (request, response) => {
  UserIdValidator.validateUserId(request);

  const {userId, bookmarkId} = request.params;
  const bookmark = await PersonalBookmarksService.getBookmarkById(userId, bookmarkId);

  return response.status(HttpStatus.OK).send(bookmark);
});

/* GET sharableId for bookmark */
personalBookmarksRouter.get('/shareable/:bookmarkId', keycloak.protect(), async (request, response) => {
  UserIdValidator.validateUserId(request);

  const {userId, bookmarkId} = request.params;
  const shareableId = await PersonalBookmarksService.getOrCreateSharableId(userId, bookmarkId);
  const sharableIdResponse = {"shareableId": shareableId}
  return response.json(sharableIdResponse);
});

/**
 * full UPDATE via PUT - that is the whole document is required and will be updated
 * the descriptionHtml parameter is only set in backend, if only does not come front-end (might be an API call)
 */
personalBookmarksRouter.put('/:bookmarkId', keycloak.protect(), async (request, response) => {

  UserIdValidator.validateUserId(request);

  const bookmark = bookmarkRequestMapper.toBookmark(request);

  const {userId, bookmarkId} = request.params;
  const updatedBookmark = await PersonalBookmarksService.updateBookmark(userId, bookmarkId, bookmark);

  return response.status(HttpStatus.OK).send(updatedBookmark);
});


/**
 * full UPDATE via PUT - that is the whole document is required and will be updated
 * the descriptionHtml parameter is only set in backend, if only does not come front-end (might be an API call)
 */
personalBookmarksRouter.post('/:bookmarkId/owner-visits/inc', keycloak.protect(), async (request, response) => {

  UserIdValidator.validateUserId(request);

  const {userId, bookmarkId} = request.params;
  await PersonalBookmarksService.increaseOwnerVisitCount(userId, bookmarkId);

  return response.status(HttpStatus.OK).send();
});

/*
* DELETE bookmark for user
*/
personalBookmarksRouter.delete('/:bookmarkId', keycloak.protect(), async (request, response) => {

  UserIdValidator.validateUserId(request);
  const {userId, bookmarkId} = request.params;
  await PersonalBookmarksService.deleteBookmarkById(userId, bookmarkId);
  return response.status(HttpStatus.NO_CONTENT).send();
});

/*
* DELETE bookmark for user by location
*/
personalBookmarksRouter.delete('/', keycloak.protect(), async (request, response, next) => {
  UserIdValidator.validateUserId(request);

  const location = request.query.location;
  if ( location ) {
    await PersonalBookmarksService.deleteBookmarkByLocation(request.params.userId, location);
    return response.status(HttpStatus.NO_CONTENT).send();
  } else {
    next();
  }

});

/*
* DELETE private bookmarks for user and tag
*/
personalBookmarksRouter.delete('/', keycloak.protect(), async (request, response, next) => {
  UserIdValidator.validateUserId(request);

  const {tag, type} = request.query;
  if ( tag && type === 'private' ) {
    const deletedCount = await PersonalBookmarksService.deletePrivateBookmarksByTag(request.params.userId, tag);
    return response.status(HttpStatus.OK).send({deletedCount: deletedCount});
  } else {
    next();
  }
});

personalBookmarksRouter.delete('/', keycloak.protect(), async () => {
  throw new ValidationError('Missing parameters',
    ['You need to provide location or tag to delete personal bookmarks']);
});

personalBookmarksRouter.patch('/display-name', keycloak.protect(), async (request, response) => {
  UserIdValidator.validateUserId(request);
  const userId = request.params.userId;
  const displayName = request.body.displayName;

  await PersonalBookmarksService.updateDisplayNameInBookmarks(userId, displayName);

  return response.status(HttpStatus.OK).send();
});

module.exports = personalBookmarksRouter;
