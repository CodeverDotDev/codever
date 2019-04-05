const express = require('express');
const personalBookmarksRouter = express.Router({mergeParams: true});
const Keycloak = require('keycloak-connect');

const Bookmark = require('../../models/bookmark');
const bookmarkHelper = require('../../common/bookmark-helper');
const MyError = require('../../models/error');

const common = require('../../common/config');
const config = common.config();

const constants = require('../../common/constants');

const HttpStatus = require('http-status-codes');

//showdown converter - https://github.com/showdownjs/showdown
const showdown = require('showdown'),
  converter = new showdown.Converter();

//add keycloak middleware
var keycloak = new Keycloak({scope: 'openid'}, config.keycloak);
personalBookmarksRouter.use(keycloak.middleware());

/**
 * CREATE bookmark for user
 */
personalBookmarksRouter.post('/', keycloak.protect(), async (request, response) => {

  let userId = request.kauth.grant.access_token.content.sub;
  if (userId !== request.params.userId) {
    return response
      .status(HttpStatus.UNAUTHORIZED)
      .send(new MyError('Unauthorized', ['the userId does not match the subject in the access token']));
  }

  const bookmark = bookmarkHelper.buildBookmarkFromRequest(request);

  const missingRequiredAttributes = !bookmark.name || !bookmark.location || !bookmark.tags || bookmark.tags.length === 0;
  if (missingRequiredAttributes) {
    return response
      .status(HttpStatus.BAD_REQUEST)
      .send(new MyError('Missing required attributes', ['Missing required attributes']));
  }
  if (bookmark.tags.length > constants.MAX_NUMBER_OF_TAGS) {
    return response
      .status(HttpStatus.BAD_REQUEST)
      .send(new MyError('Too many tags have been submitted', ['Too many tags have been submitted']));
  }

  if (bookmark.description) {
    const descriptionIsTooLong = bookmark.description.length > constants.MAX_NUMBER_OF_CHARS_FOR_DESCRIPTION;
    if (descriptionIsTooLong) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .send(new MyError('The description is too long. Only ' + constants.MAX_NUMBER_OF_CHARS_FOR_DESCRIPTION + ' allowed',
          ['The description is too long. Only ' + constants.MAX_NUMBER_OF_CHARS_FOR_DESCRIPTION + ' allowed']));
    }

    const descriptionHasTooManyLines = bookmark.description.split('\n').length > constants.MAX_NUMBER_OF_LINES_FOR_DESCRIPTION;
    if (descriptionHasTooManyLines) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .send(new MyError('The description hast too many lines. Only ' + constants.MAX_NUMBER_OF_LINES_FOR_DESCRIPTION + ' allowed',
          ['The description hast too many lines. Only ' + constants.MAX_NUMBER_OF_LINES_FOR_DESCRIPTION + ' allowed']));
    }
  }

  try {
    let newBookmark = await bookmark.save();

    response
      .set('Location', `${config.basicApiUrl}private/${request.params.userId}/bookmarks/${newBookmark.id}`)
      .status(HttpStatus.CREATED)
      .send({response: 'Bookmark created for userId ' + request.params.userId});

  } catch (err) {
    const duplicateKeyinMongoDb = err.name === 'MongoError' && err.code === 11000;
    if (duplicateKeyinMongoDb) {
      return response
        .status(HttpStatus.CONFLICT)
        .send(new MyError('Duplicate key', [err.message]));
    }
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(err);
  }

});



/* GET personal bookmarks of the user */
personalBookmarksRouter.get('/', keycloak.protect(), async (request, response) => {
  try {
    let bookmarks;
    let userId = request.kauth.grant.access_token.content.sub;
    if (userId !== request.params.userId) {
      return response
        .status(HttpStatus.UNAUTHORIZED)
        .send(new MyError('Unauthorized', ['the userId does not match the subject in the access token']));
    }
    if (request.query.term) {
      var regExpTerm = new RegExp(request.query.term, 'i');
      var regExpSearch = [{name: {$regex: regExpTerm}}, {description: {$regex: regExpTerm}}, {category: {$regex: regExpTerm}}, {tags: {$regex: regExpTerm}}];
      bookmarks = await Bookmark.find({userId: request.params.userId, '$or': regExpSearch});
    } else {//no filter - all bookmarks
      bookmarks = await Bookmark.find({userId: request.params.userId});
    }

    response.send(bookmarks);
  } catch (err) {
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(err);
  }
});

/* GET bookmark of user */
personalBookmarksRouter.get('/:bookmarkId', keycloak.protect(), async (request, response) => {

  const userId = request.kauth.grant.access_token.content.sub;
  if (userId !== request.params.userId) {
    return response
      .status(HttpStatus.UNAUTHORIZED)
      .send(new MyError('Unauthorized', ['the userId does not match the subject in the access token']));
  }

  try {
    const bookmark = await Bookmark.findOne({
      _id: request.params.bookmarkId,
      userId: request.params.userId
    });

    if (!bookmark) {
      return response
        .status(HttpStatus.NOT_FOUND)
        .send(new MyError(
          'Not Found Error',
          ['Bookmark for user id ' + request.params.userId + ' and bookmark id ' + request.params.bookmarkId + ' not found']
          )
        );
    } else {
      response.status(HttpStatus.OK).send(bookmark);
    }
  } catch (err) {
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(new MyError('Unknown server error',
        ['Unknown server error when trying to delete bookmark with id ' + request.params.bookmarkId]));
  }
});

/**
 * full UPDATE via PUT - that is the whole document is required and will be updated
 * the descriptionHtml parameter is only set in backend, if only does not come front-end (might be an API call)
 */
personalBookmarksRouter.put('/:bookmarkId', keycloak.protect(), async (request, response) => {

  let userId = request.kauth.grant.access_token.content.sub;
  if (userId !== request.params.userId) {
    return response
      .status(HttpStatus.UNAUTHORIZED)
      .send(new MyError('Unauthorized', ['the userId does not match the subject in the access token']));
  }

  const requiredAttributesMissing = !request.body.name || !request.body.location || !request.body.tags || request.body.tags.length === 0;
  if (requiredAttributesMissing) {
    return response
      .status(HttpStatus.BAD_REQUEST)
      .send(new MyError('Missing required attributes', ['Missing required attributes']));
  }

  if (request.body.tags.length > constants.MAX_NUMBER_OF_TAGS) {
    return response
      .status(HttpStatus.BAD_REQUEST)
      .send(new MyError('Too many tags have been submitted', ['Too many tags have been submitted']));
  }

  const descriptionIsTooLong = request.body.description.length > constants.MAX_NUMBER_OF_CHARS_FOR_DESCRIPTION;
  if (descriptionIsTooLong) {
    return response
      .status(HttpStatus.BAD_REQUEST)
      .send(new MyError('The description is too long. Only ' + constants.MAX_NUMBER_OF_CHARS_FOR_DESCRIPTION + ' allowed',
        ['The description is too long. Only ' + constants.MAX_NUMBER_OF_CHARS_FOR_DESCRIPTION + ' allowed']));
  }

  if (request.body.description) {
    const descriptionHasTooManyLines = request.body.description.split('\n').length > constants.MAX_NUMBER_OF_LINES_FOR_DESCRIPTION;
    if (descriptionHasTooManyLines) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .send(new MyError('The description hast too many lines. Only ' + constants.MAX_NUMBER_OF_LINES_FOR_DESCRIPTION + ' allowed',
          ['The description hast too many lines. Only ' + constants.MAX_NUMBER_OF_LINES_FOR_DESCRIPTION + ' allowed']));
    }
  }

  if (!request.body.descriptionHtml) {
    request.body.descriptionHtml = converter.makeHtml(request.body.description);
  }
  try {
    const bookmark = await Bookmark.findOneAndUpdate(
      {
        _id: request.params.bookmarkId,
        userId: request.params.userId
      },
      request.body,
      {new: true}
    );

    const bookmarkNotFound = !bookmark;
    if (bookmarkNotFound) {
      return response
        .status(HttpStatus.NOT_FOUND)
        .send(new MyError('Not Found Error', ['Bookmark for user id ' + request.params.userId + ' and bookmark id ' + request.params.bookmarkId + ' not found']));
    } else {
      response
        .status(200)
        .send(bookmark);
    }
  } catch (err) {
    if (err.name === 'MongoError' && err.code === 11000) {
      return response
        .status(HttpStatus.CONFLICT)
        .send(new MyError('Duplicate key', [err.message]));
    }
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(new MyError('Unknown Server Error', ['Unknown server error when updating bookmark for user id ' + request.params.userId + ' and bookmark id ' + request.params.bookmarkId]));
  }
});

/*
* DELETE bookmark for user
*/
personalBookmarksRouter.delete('/:bookmarkId', keycloak.protect(), async (request, response) => {

  const userId = request.kauth.grant.access_token.content.sub;
  if (userId !== request.params.userId) {
    return response
      .status(HttpStatus.UNAUTHORIZED)
      .send(new MyError('Unauthorized', ['the userId does not match the subject in the access token']));
  }

  try {
    const bookmark = await Bookmark.findOneAndRemove({
      _id: request.params.bookmarkId,
      userId: request.params.userId
    });

    if (!bookmark) {
      return response
        .status(HttpStatus.NOT_FOUND)
        .send(new MyError(
          'Not Found Error',
          ['Bookmark for user id ' + request.params.userId + ' and bookmark id ' + request.params.bookmarkId + ' not found']
          )
        );
    } else {
      response.status(HttpStatus.NO_CONTENT).send('Bookmark successfully deleted');
    }
  } catch (err) {
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(new MyError('Unknown server error',
        ['Unknown server error when trying to delete bookmark with id ' + request.params.bookmarkId]));
  }
});

module.exports = personalBookmarksRouter;
