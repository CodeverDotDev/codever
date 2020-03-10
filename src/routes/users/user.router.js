const express = require('express');
const usersRouter = express.Router();
const personalBookmarksRouter = require('./bookmarks/personal-bookmarks.router');

const Keycloak = require('keycloak-connect');

const UserDataService = require('./user-data.service');
const userIdTokenValidator = require('./userid.validator');
const PaginationQueryParamsHelper = require('../../common/pagination-query-params-helper');

const common = require('../../common/config');
const config = common.config();

const HttpStatus = require('http-status-codes/index');

//add keycloak middleware
const keycloak = new Keycloak({scope: 'openid'}, config.keycloak);
usersRouter.use(keycloak.middleware());

usersRouter.use('/:userId/bookmarks', personalBookmarksRouter);

/* GET personal bookmarks of the users */
usersRouter.get('/:userId', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  const userData = await UserDataService.getUserData(request.params.userId);
  return response.status(HttpStatus.OK).json(userData);
});

/* GET list of bookmarks to be read later for the user */
usersRouter.get('/:userId/read-later', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  const {page, limit} = PaginationQueryParamsHelper.getPageAndLimit(request);
  const bookmarks = await UserDataService.getReadLater(request.params.userId, page, limit);

  response.status(HttpStatus.OK).send(bookmarks);
});

/* GET list of liked bookmarks by the user */
usersRouter.get('/:userId/likes', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  const likedBookmarks = await UserDataService.getLikedBookmarks(request.params.userId);

  response.send(likedBookmarks);
});

/* GET list of bookmarks for the user's watchedTags */
usersRouter.get('/:userId/watched-tags', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  const {page, limit} = PaginationQueryParamsHelper.getPageAndLimit(request);
  const bookmarks = await UserDataService.getWatchedTags(request.params.userId, page, limit);

  response.send(bookmarks);
});

/* GET list of used tag for the user */
usersRouter.get('/:userId/used-tags', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  const usedTagsForPublicBookmarks = await UserDataService.getUsedTagsForPublicBookmarks(request.params.userId);
  const usedTagsForPrivateBookmarks = await UserDataService.getUsedTagsForPrivateBookmarks(request.params.userId);

  const usedTags = {
    public: usedTagsForPublicBookmarks,
    private: usedTagsForPrivateBookmarks
  }

  response.send(usedTags);
});

/* GET list of user's pinned bookmarks */
usersRouter.get('/:userId/pinned', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  const {page, limit} = PaginationQueryParamsHelper.getPageAndLimit(request);
  const pinnedBookmarks = await UserDataService.getPinnedBookmarks(request.params.userId, page, limit);

  response.send(pinnedBookmarks);
});

/* GET list of user's favorite bookmarks */
usersRouter.get('/:userId/favorites', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  const {page, limit} = PaginationQueryParamsHelper.getPageAndLimit(request);
  const favoriteBookmarks = await UserDataService.getFavoriteBookmarks(request.params.userId, page, limit);

  response.send(favoriteBookmarks);
});

/* GET list of user's last visited bookmarks */
usersRouter.get('/:userId/history', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  const {page, limit} = PaginationQueryParamsHelper.getPageAndLimit(request);
  const bookmarksFromHistory = await UserDataService.getBookmarksFromHistory(request.params.userId, page, limit);

  response.send(bookmarksFromHistory);
});

/*
* create user details
* */
usersRouter.post('/:userId', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  const newUserData = await UserDataService.createUserData(request.body, request.params.userId);

  return response.status(HttpStatus.CREATED).send(newUserData);
});

/* UPDATE user details
* If users data is not present it will be created (upsert=true)
*
* */
usersRouter.put('/:userId', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  const userData = request.body;
  const updatedUserData = await UserDataService.updateUserData(userData, request.params.userId);
  return response.status(HttpStatus.OK).send(updatedUserData);
});

/*
* DELETE user
*/
usersRouter.delete('/:userId', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  await UserDataService.deleteUserData(request.params.userId);

  return response.status(HttpStatus.NO_CONTENT).send();
});

/*
* rate bookmark
*/
usersRouter.patch('/:userId/bookmarks/likes/:bookmarkId', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  const bookmark = await UserDataService.rateBookmark(request.body, request.params.userId, request.params.bookmarkId);

  return response.status(HttpStatus.OK).send(bookmark);
});

module.exports = usersRouter;
