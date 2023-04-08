const express = require('express');
const adminRouter = express.Router();

const Keycloak = require('keycloak-connect');

const bookmarkRequestMapper = require('../../common/mappers/bookmark-request.mapper');

const common = require('../../common/config');
const config = common.config();
const AdminService = require('./admin.service');

const HttpStatus = require('http-status-codes/index');

//add keycloak middleware
const keycloak = new Keycloak({ scope: 'openid' }, config.keycloak);
adminRouter.use(keycloak.middleware());

const superagent = require('superagent');

/* GET all bookmarks */
adminRouter.get(
  '/bookmarks',
  keycloak.protect('realm:ROLE_ADMIN'),
  async (request, response) => {
    const isPublic = request.query.public === 'true';
    const { location, userId } = request.query;

    const bookmarks = await AdminService.getBookmarksWithFilter(
      isPublic,
      location,
      userId
    );
    response.send(bookmarks);
  }
);

adminRouter.get(
  '/tags',
  keycloak.protect('realm:ROLE_ADMIN'),
  async (request, response) => {
    const tags = await AdminService.getTagsOrderByNumberDesc();

    response.send(tags);
  }
);

/**
 * Returns the bookmarks added recently.
 *
 * The since query parameter is a timestamp which specifies the date since we want to look forward to present time.
 * If this parameter is present it has priority. If it is not present, we might specify the number of days to look back via
 * the query parameter numberOfDays. If not present it defaults to 7 days, last week.
 *
 */
adminRouter.get(
  '/bookmarks/latest-entries',
  keycloak.protect('realm:ROLE_ADMIN'),
  async (request, response, next) => {
    if (request.query.since) {
      const fromDate = new Date(parseFloat(request.query.since, 0));
      const toDate = request.query.to
        ? new Date(parseFloat(request.query.to, 0))
        : new Date();
      const bookmarks = await AdminService.getLatestBookmarksBetweenDates(
        fromDate,
        toDate
      );

      response.send(bookmarks);
    } else {
      next();
    }
  }
);

adminRouter.get(
  '/bookmarks/latest-entries',
  keycloak.protect('realm:ROLE_ADMIN'),
  async (request, response) => {
    const daysBack = request.query.days ? request.query.days : 7;
    const bookmarks = await AdminService.getLatestBookmarksWithDaysBack(
      daysBack
    );

    response.send(bookmarks);
  }
);

/* GET bookmark by id */
adminRouter.get(
  '/bookmarks/:bookmarkId',
  keycloak.protect(),
  async (request, response) => {
    const bookmark = await AdminService.getBookmarkById(
      request.params.bookmarkId
    );
    return response.status(HttpStatus.OK).send(bookmark);
  }
);

/**
 * create bookmark
 */
adminRouter.post(
  '/bookmarks',
  keycloak.protect('realm:ROLE_ADMIN'),
  async (request, response) => {
    const bookmark = bookmarkRequestMapper.toBookmark(request);
    let newBookmark = await AdminService.createBookmark(bookmark);

    response
      .set(
        'Location',
        `${config.basicApiUrl}/personal/users/${request.params.userId}/bookmarks/${newBookmark.id}`
      )
      .status(HttpStatus.CREATED)
      .send({
        response: 'Bookmark created for userId ' + request.params.userId,
      });
  }
);

/**
 * full UPDATE via PUT - that is the whole document is required and will be updated
 * the descriptionHtml parameter is only set in backend, if only does not come front-end (might be an API call)
 */
adminRouter.put(
  '/bookmarks/:bookmarkId',
  keycloak.protect('realm:ROLE_ADMIN'),
  async (request, response) => {
    const bookmark = bookmarkRequestMapper.toBookmark(request);
    const updatedBookmark = await AdminService.updateBookmark(bookmark);

    return response.status(HttpStatus.OK).send(updatedBookmark);
  }
);

/*
 * DELETE bookmark for by bookmarkId
 */
adminRouter.delete(
  '/bookmarks/:bookmarkId',
  keycloak.protect('realm:ROLE_ADMIN'),
  async (request, response) => {
    await AdminService.deleteBookmarkById(request.params.bookmarkId);
    response
      .status(HttpStatus.NO_CONTENT)
      .send('Bookmark successfully deleted');
  }
);

/*
 * DELETE bookmarks with location
 */
adminRouter.delete(
  '/bookmarks',
  keycloak.protect('realm:ROLE_ADMIN'),
  async (request, response, next) => {
    const location = request.query.location;
    if (location) {
      await AdminService.deleteBookmarksByLocation(location);
      return response.status(HttpStatus.NO_CONTENT).send();
    } else {
      next();
    }
  }
);

/**
 * Delete bookmarks of a user, identified by userId
 */
adminRouter.delete(
  '/bookmarks',
  keycloak.protect('realm:ROLE_ADMIN'),
  async (request, response, next) => {
    const userId = request.query.userId;
    if (userId) {
      await AdminService.deleteBookmarksByUserId(userId);
      return response.status(HttpStatus.NO_CONTENT).send();
    } else {
      next();
    }
  }
);

/**
 * Report error if it reaches this point
 */
adminRouter.delete(
  '/bookmarks',
  keycloak.protect('realm:ROLE_ADMIN'),
  async (request, response) => {
    return response.status(HttpStatus.BAD_REQUEST).send({
      message:
        'You can either delete bookmarks by location or userId - at least one of them mandatory',
    });
  }
);

/*
  updates user display name
  This should be used only one time.
 */
adminRouter.put(
  '/users/profile/display-name',
  keycloak.protect('realm:KEYCLOAK_REALM_ADMIN'),
  async (request, response) => {
    const responseUsers = await superagent
      .get(
        `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`
      )
      .set('Authorization', request.headers.authorization)
      .query({ briefRepresentation: true })
      .query({ first: 0 })
      .query({ max: 500 });

    const keycloakUsers = responseUsers.body;
    const updatedUsers = await AdminService.updateDisplayNameForUsers(
      keycloakUsers
    );

    return response.status(HttpStatus.OK).send(updatedUsers);
  }
);

/**
 * Updates user profile image url with gravatar image if present
 *
 */

adminRouter.put(
  '/users/profile/image-url',
  keycloak.protect('realm:KEYCLOAK_REALM_ADMIN'),
  async (request, response) => {
    const responseUsers = await superagent
      .get(
        `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`
      )
      .set('Authorization', request.headers.authorization)
      .query({ briefRepresentation: true })
      .query({ first: 0 })
      .query({ max: 500 });

    const keycloakUsers = responseUsers.body;
    const updatedUsers =
      await AdminService.setProfileImageUrlForUsersWithGravatar(keycloakUsers);

    return response.status(HttpStatus.OK).send(updatedUsers);
  }
);

//deletes user from keycloak and mongo
adminRouter.delete(
  '/users/:userId',
  keycloak.protect('realm:KEYCLOAK_REALM_ADMIN'),
  async (request, response) => {
    const userId = request.params.userId;
    const userDeletedResponse = await superagent
      .delete(
        `${process.env.KEYCLOAK_SERVER_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}`
      )
      .set('Authorization', request.headers.authorization);

    if (userDeletedResponse.ok) {
      await AdminService.deleteUserByUserId(userId);
      await AdminService.deleteBookmarksByUserId(userId);

      return response.status(HttpStatus.NO_CONTENT).send();
    }
  }
);

module.exports = adminRouter;
