const express = require('express');
const usersRouter = express.Router();

const personalBookmarksRouter = require('./bookmarks/personal-bookmarks.router');
const personalCodeletsRouter = require('./snippets/personal-snippets.router');

const Keycloak = require('keycloak-connect');

const browserBookmarksImportService = require('./browser-bookmarks-import.service');

const UserDataService = require('./user-data.service');
const PersonalSearchService = require('./personal-search.service');
const userIdTokenValidator = require('./userid.validator');
const PaginationQueryParamsHelper = require('../../common/pagination-query-params-helper');
const FileTypeValidationHelper = require('./file-type-validation.helper');

const common = require('../../common/config');
const config = common.config();

const HttpStatus = require('http-status-codes/index');

//add keycloak middleware
const keycloak = new Keycloak({scope: 'openid'}, config.keycloak);
usersRouter.use(keycloak.middleware());

const aws = require('aws-sdk');
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new aws.S3();
const multer = require("multer");
const multerS3 = require('multer-s3');
const path = require('path')

const upload = multer({
  limits: {
    fileSize: 1048576 // 1MB
  },
  fileFilter: FileTypeValidationHelper.imageFilter,
  storage: multerS3({
    s3: s3,
    bucket: 'bookmarks.dev',
    acl: 'public-read',
    cacheControl: 'max-age=31536000',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      const key = `user-profile-images/${process.env.NODE_ENV}/${req.params.userId}_${Date.now().toString()}${path.extname(file.originalname)}`
      cb(null, key);
    }
  })
});

const uploadBookmarks = multer({
  fileFilter: FileTypeValidationHelper.htmlFileFilter,
  storage: multer.memoryStorage()
});

usersRouter.use('/:userId/bookmarks', personalBookmarksRouter);
usersRouter.use('/:userId/snippets', personalCodeletsRouter);

usersRouter.get('/:userId', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  const userData = await UserDataService.getUserData(request.params.userId);

  return response.status(HttpStatus.OK).json(userData);
});

/* save profile picture */
usersRouter.post('/:userId/profile-picture', keycloak.protect(),
  upload.single("image" /* name attribute of <file> element in your form */),
  async (request, response) => {
    userIdTokenValidator.validateUserId(request);

    return response.status(HttpStatus.OK).send({
      url: request.file.location
    });
  });

/* upload bookmarks */
usersRouter.post('/:userId/bookmarks/upload', keycloak.protect(),
  uploadBookmarks.single("bookmarks" /* name attribute of <file> element in your form */),
  async (request, response) => {
    userIdTokenValidator.validateUserId(request);

    const userDisplayName = request.body.userDisplayName;
    const importResponse = await browserBookmarksImportService.importBrowserBookmarks(request.params.userId, request.file.buffer, userDisplayName);

    return response.status(HttpStatus.OK).send(importResponse);
  }
);

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


/* GET list of bookmarks for the user's feed */
usersRouter.get('/:userId/feed', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  const {page, limit} = PaginationQueryParamsHelper.getPageAndLimit(request);
  const bookmarks = await UserDataService.getFeedBookmarks(request.params.userId, page, limit);

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

/*
/**
 * Deprecated - might get reactivated if community decides for it
 *
 * GET list of user's favorite bookmarks
 */
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
  let bookmarksFromHistory;
  if ( page ) {
    bookmarksFromHistory = await UserDataService.getBookmarksFromHistory(request.params.userId, page, limit);
  } else {
    bookmarksFromHistory = await UserDataService.getAllBookmarksFromHistory(request.params.userId, page, limit);
  }

  response.send(bookmarksFromHistory);
});

/* GET search results from user's both bookmarks and snippets */
usersRouter.get('/:userId/search-results', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  const {page, limit} = PaginationQueryParamsHelper.getPageAndLimit(request);
  const searchText = request.query.q;
  const searchInclude = request.query.include || 'all';
  const  personalSearchResults = await PersonalSearchService.getPersonalSearchResults(request.params.userId, searchText, page, limit, searchInclude);

  response.send(personalSearchResults);
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
* UPDATE user history
*/
usersRouter.patch('/:userId/history', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  await UserDataService.updateUserDataHistory(request.body, request.params.userId);
  return response.status(HttpStatus.OK).send({historyUpdated: true});
});

/*
* UPDATE user pinned
*/
usersRouter.patch('/:userId/pinned', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  const pinnedBookmarkIds = request.body.pinnedBookmarkIds;
  await UserDataService.updateUserDataPinned(pinnedBookmarkIds, request.params.userId);
  return response.status(HttpStatus.OK).send({userDataPinnedUpdated: true});
});

/*
* UPDATE user data read later
*/
usersRouter.patch('/:userId/read-later', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  const readLaterBookmarkIds = request.body.readLaterBookmarkIds;
  await UserDataService.updateUserDataReadLater(readLaterBookmarkIds, request.params.userId);
  return response.status(HttpStatus.OK).send({userDataReadLaterUpdated: true});
});


/*
* UPDATE user history, readLater and pinned
*/
usersRouter.patch('/:userId/history-readlater-pinned', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  await UserDataService.updateUserDataHistoryReadLaterPinned(request.body, request.params.userId);
  return response.status(HttpStatus.OK).send({historyUpdated: true});
});

/*
* Update toggle to display in landing page
*/
usersRouter.patch('/:userId/feed-toggle', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  await UserDataService.updateUserDataFeedToggle(request.body.showAllPublicInFeed, request.params.userId);

  return response.status(HttpStatus.OK).send({dataFeedToggleUpdated: true});
});

/*
* Update local storage setup
*/
usersRouter.patch('/:userId/local-storage', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  await UserDataService.updateLocalStorageOption(request.body.enableLocalStorage, request.params.userId);

  return response.status(HttpStatus.OK).send({localStorageOptionUpdated: true});
});

/*
* Update welcomeAck flag
*/
usersRouter.patch('/:userId/welcome-acknowledge', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  await UserDataService.updateUserDataWelcomeAck(request.params.userId);

  return response.status(HttpStatus.OK).send({welcomeAck: true});
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

usersRouter.patch('/:userId/following/users/:followedUserId', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  const {userId, followedUserId} = request.params;
  const updatedUserData = await UserDataService.followUser(userId, followedUserId);

  return response.status(HttpStatus.OK).send(updatedUserData);
});

usersRouter.patch('/:userId/unfollowing/users/:followedUserId', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  const {userId, followedUserId} = request.params;
  const updatedUserData = await UserDataService.unfollowUser(userId, followedUserId);

  return response.status(HttpStatus.OK).send(updatedUserData);
});

usersRouter.get('/:userId/following/users', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  const followedUsersData = await UserDataService.getFollowedUsersData(request.params.userId);

  return response.status(HttpStatus.OK).send(followedUsersData);
});

usersRouter.get('/:userId/followers', keycloak.protect(), async (request, response) => {
  userIdTokenValidator.validateUserId(request);
  const followers = await UserDataService.getFollowers(request.params.userId);

  return response.status(HttpStatus.OK).send(followers);
});


module.exports = usersRouter;
