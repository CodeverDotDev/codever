const express = require('express');
const personalBookmarksRouter = express.Router({mergeParams: true});
const Keycloak = require('keycloak-connect');

const bookmarkHelper = require('../../../common/bookmark-helper');
const bookmarksSearchService = require('../../../common/bookmarks-search.service');
const PersonalBookmarksService = require('./personal-bookmarks.service');
const UserIdValidator = require('../userid.validator');

const ValidationError = require('../../../error/validation.error');

const common = require('../../../common/config');
const config = common.config();

const constants = require('../../../common/constants');

const HttpStatus = require('http-status-codes/index');

//add keycloak middleware
const keycloak = new Keycloak({scope: 'openid'}, config.keycloak);
personalBookmarksRouter.use(keycloak.middleware());


/**
 * CREATE bookmark for user
 */
//personalBookmarksRouter.post('/', keycloak.protect(), async (request, response) => {
personalBookmarksRouter.post('/', keycloak.protect(), async (request, response) => {

  UserIdValidator.validateUserId(request);
  const bookmark = bookmarkHelper.buildBookmarkFromRequest(request);
  let newBookmark = await PersonalBookmarksService.createBookmark(request.params.userId, bookmark);

  response
    .set('Location', `${config.basicApiUrl}private/${request.params.userId}/bookmarks/${newBookmark.id}`)
    .status(HttpStatus.CREATED)
    .send({response: 'Bookmark created for userId ' + request.params.userId});

});

/* GET bookmark of user  by id*/
personalBookmarksRouter.get('/', keycloak.protect(), async (request, response, next) => {
  UserIdValidator.validateUserId(request);

  const searchText = request.query.q;
  const limit = parseInt(request.query.limit);

  if (searchText) {
    const bookmarks = await bookmarksSearchService.findBookmarks(searchText, limit, constants.DOMAIN_PERSONAL, request.params.userId);
    return response.send(bookmarks);
  } else {
    next();
  }

});

/* GET bookmark of user by location*/
personalBookmarksRouter.get('/', keycloak.protect(), async (request, response, next) => {
  if (request.query.location) {
    const bookmark = await PersonalBookmarksService.getBookmarkByLocation(request.params.userId, request.query.location);
    return response.send(bookmark);
  } else {
    next();
  }
});

/* GET bookmark of user */
personalBookmarksRouter.get('/', keycloak.protect(), async (request, response) => {
  let bookmarks;
  const orderBy = request.query.orderBy;
  switch (orderBy) {
    case 'MOST_LIKES':
      bookmarks = await PersonalBookmarksService.getMostLikedBookmarks(request.params.userId);
      break;
    case 'LAST_CREATED':
      bookmarks = await PersonalBookmarksService.getLastCreatedBookmarks(request.params.userId);
      break;
    case 'MOST_USED':
      bookmarks = await PersonalBookmarksService.getMostUsedBookmarks(request.params.userId);
      break;
    default:
      bookmarks = await PersonalBookmarksService.getLastAccessedBookmarks(request.params.userId);
  }

  return response.send(bookmarks);
});

/* GET tags used by user */
personalBookmarksRouter.get('/tags', keycloak.protect(), async (request, response) => {
  UserIdValidator.validateUserId(request);
  const tags = await PersonalBookmarksService.getTagsForUser(request.params.userId);

  response.send(tags);
});


/* GET bookmark of user */
personalBookmarksRouter.get('/:bookmarkId', keycloak.protect(), async (request, response) => {
  UserIdValidator.validateUserId(request);

  const {userId, bookmarkId} = request.params;
  const bookmark = await PersonalBookmarksService.getBookmarkById(userId, bookmarkId);

  return response.status(HttpStatus.OK).send(bookmark);
});

/**
 * full UPDATE via PUT - that is the whole document is required and will be updated
 * the descriptionHtml parameter is only set in backend, if only does not come front-end (might be an API call)
 */
personalBookmarksRouter.put('/:bookmarkId', keycloak.protect(), async (request, response) => {

  UserIdValidator.validateIsAdminOrUserId(request);

  const bookmark = bookmarkHelper.buildBookmarkFromRequest(request);

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

  UserIdValidator.validateIsAdminOrUserId(request);

  await PersonalBookmarksService.deleteBookmarkById(request.params.userId, request.params.bookmarkId);
  return response.status(HttpStatus.NO_CONTENT).send();
});

/*
* DELETE bookmark for user by location
*/
personalBookmarksRouter.delete('/', keycloak.protect(), async (request, response, next) => {
  UserIdValidator.validateIsAdminOrUserId(request);

  const location = request.query.location;
  if (location) {
    await PersonalBookmarksService.deleteBookmarkByLocation(request.params.userId, location);
  } else {
    next();
  }

  return response.status(HttpStatus.NO_CONTENT).send();
});

personalBookmarksRouter.delete('/', keycloak.protect(), async () => {
  throw new ValidationError('Missing parameters',
    ['You need to provide bookmark id or location to delete personal bookmarks']);
});

module.exports = personalBookmarksRouter;
