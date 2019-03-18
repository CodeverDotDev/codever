var express = require('express');
var personalCodingmarksRouter = express.Router({mergeParams: true});
var Keycloak = require('keycloak-connect');

  var Bookmark = require('../../models/bookmark');
var MyError = require('../../models/error');

var common = require('../../common/config');
var config = common.config();

var HttpStatus = require('http-status-codes');

//showdown converter - https://github.com/showdownjs/showdown
var showdown = require('showdown'),
  converter = new showdown.Converter();

//add keycloak middleware
var keycloak = new Keycloak({scope: 'openid'}, config.keycloak);
personalCodingmarksRouter.use(keycloak.middleware());

const MAX_NUMBER_OF_TAGS = 8;

const MAX_NUMBER_OF_CHARS_FOR_DESCRIPTION = 1500;

const MAX_NUMBER_OF_LINES_FOR_DESCRIPTION = 100;

/**
 * CREATE bookmark for user
 */
personalCodingmarksRouter.post('/', keycloak.protect(), async (request, response) => {

  let userId = request.kauth.grant.access_token.content.sub;
  if (userId !== request.params.userId) {
    return response
      .status(HttpStatus.UNAUTHORIZED)
      .send(new MyError('Unauthorized', ['the userId does not match the subject in the access token']));
  }

  const bookmark = buildCodingmarkFromRequest(request);

  const missingRequiredAttributes = !bookmark.name || !bookmark.location || !bookmark.tags || bookmark.tags.length === 0;
  if (missingRequiredAttributes) {
    return response
      .status(HttpStatus.BAD_REQUEST)
      .send(new MyError('Missing required attributes', ['Missing required attributes']));
  }
  if (bookmark.tags.length > MAX_NUMBER_OF_TAGS) {
    return response
      .status(HttpStatus.BAD_REQUEST)
      .send(new MyError('Too many tags have been submitted', ['Too many tags have been submitted']));
  }

  if (bookmark.description) {
    const descriptionIsTooLong = bookmark.description.length > MAX_NUMBER_OF_CHARS_FOR_DESCRIPTION;
    if (descriptionIsTooLong) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .send(new MyError('The description is too long. Only ' + MAX_NUMBER_OF_CHARS_FOR_DESCRIPTION + ' allowed', ['The description is too long. Only ' + MAX_NUMBER_OF_CHARS_FOR_DESCRIPTION + ' allowed']));
    }

    const descriptionHasTooManyLines = bookmark.description.split('\n').length > MAX_NUMBER_OF_LINES_FOR_DESCRIPTION;
    if (descriptionHasTooManyLines) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .send(new MyError('The description hast too many lines. Only ' + MAX_NUMBER_OF_LINES_FOR_DESCRIPTION + ' allowed', ['The description hast too many lines. Only ' + MAX_NUMBER_OF_LINES_FOR_DESCRIPTION + ' allowed']));
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

let buildCodingmarkFromRequest = function (req) {
  const descriptionHtml = req.body.descriptionHtml ? req.body.descriptionHtml : converter.makeHtml(req.body.description);
  const bookmark = new Bookmark({
    name: req.body.name,
    location: req.body.location,
    language: req.body.language,
    description: req.body.description,
    descriptionHtml: descriptionHtml,
    category: req.body.category,
    tags: req.body.tags,
    publishedOn: req.body.publishedOn,
    githubURL: req.body.githubURL,
    userId: req.params.userId,
    shared: req.body.shared,
    starredBy: req.body.starredBy,
    lastAccessedAt: req.body.lastAccessedAt
  });

  return bookmark;
};

/* GET personal bookmarks of the user */
personalCodingmarksRouter.get('/', keycloak.protect(), async (request, response) => {
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
personalCodingmarksRouter.get('/:codingmarkId', keycloak.protect(), async (request, response) => {

  const userId = request.kauth.grant.access_token.content.sub;
  if (userId !== request.params.userId) {
    return response
      .status(HttpStatus.UNAUTHORIZED)
      .send(new MyError('Unauthorized', ['the userId does not match the subject in the access token']));
  }

  try {
    const bookmark = await Bookmark.findOne({
      _id: request.params.codingmarkId,
      userId: request.params.userId
    });

    if (!bookmark) {
      return response
        .status(HttpStatus.NOT_FOUND)
        .send(new MyError(
          'Not Found Error',
          ['Bookmark for user id ' + request.params.userId + ' and bookmark id ' + request.params.codingmarkId + ' not found']
          )
        );
    } else {
      response.status(HttpStatus.OK).send(bookmark);
    }
  } catch (err) {
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(new MyError('Unknown server error',
        ['Unknown server error when trying to delete bookmark with id ' + request.params.codingmarkId]));
  }
});

/**
 * full UPDATE via PUT - that is the whole document is required and will be updated
 * the descriptionHtml parameter is only set in backend, if only does not come front-end (might be an API call)
 */
personalCodingmarksRouter.put('/:codingmarkId', keycloak.protect(), async (request, response) => {

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

  if (request.body.tags.length > MAX_NUMBER_OF_TAGS) {
    return response
      .status(HttpStatus.BAD_REQUEST)
      .send(new MyError('Too many tags have been submitted', ['Too many tags have been submitted']));
  }

  const descriptionIsTooLong = request.body.description.length > MAX_NUMBER_OF_CHARS_FOR_DESCRIPTION;
  if (descriptionIsTooLong) {
    return response
      .status(HttpStatus.BAD_REQUEST)
      .send(new MyError('The description is too long. Only ' + MAX_NUMBER_OF_CHARS_FOR_DESCRIPTION + ' allowed',
        ['The description is too long. Only ' + MAX_NUMBER_OF_CHARS_FOR_DESCRIPTION + ' allowed']));
  }

  if (request.body.description) {
    const descriptionHasTooManyLines = request.body.description.split('\n').length > MAX_NUMBER_OF_LINES_FOR_DESCRIPTION;
    if (descriptionHasTooManyLines) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .send(new MyError('The description hast too many lines. Only ' + MAX_NUMBER_OF_LINES_FOR_DESCRIPTION + ' allowed',
          ['The description hast too many lines. Only ' + MAX_NUMBER_OF_LINES_FOR_DESCRIPTION + ' allowed']));
    }
  }

  if (!request.body.descriptionHtml) {
    request.body.descriptionHtml = converter.makeHtml(request.body.description);
  }
  try {
    const bookmark = await Bookmark.findOneAndUpdate(
      {
        _id: request.params.codingmarkId,
        userId: request.params.userId
      },
      request.body,
      {new: true}
    );

    const codingmarkNotFound = !bookmark;
    if (codingmarkNotFound) {
      return response
        .status(HttpStatus.NOT_FOUND)
        .send(new MyError('Not Found Error', ['Codingmark for user id ' + request.params.userId + ' and bookmark id ' + request.params.codingmarkId + ' not found']));
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
      .send(new MyError('Unknown Server Error', ['Unknown server error when updating bookmark for user id ' + request.params.userId + ' and bookmark id ' + request.params.codingmarkId]));
  }
});

/*
* DELETE bookmark for user
*/
personalCodingmarksRouter.delete('/:codingmarkId', keycloak.protect(), async (request, response) => {

  const userId = request.kauth.grant.access_token.content.sub;
  if (userId !== request.params.userId) {
    return response
      .status(HttpStatus.UNAUTHORIZED)
      .send(new MyError('Unauthorized', ['the userId does not match the subject in the access token']));
  }

  try {
    const bookmark = await Bookmark.findOneAndRemove({
      _id: request.params.codingmarkId,
      userId: request.params.userId
    });

    if (!bookmark) {
      return response
        .status(HttpStatus.NOT_FOUND)
        .send(new MyError(
          'Not Found Error',
          ['Bookmark for user id ' + request.params.userId + ' and bookmark id ' + request.params.codingmarkId + ' not found']
          )
        );
    } else {
      response.status(HttpStatus.NO_CONTENT).send('Codingmark successfully deleted');
    }
  } catch (err) {
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(new MyError('Unknown server error',
        ['Unknown server error when trying to delete bookmark with id ' + request.params.codingmarkId]));
  }
});

module.exports = personalCodingmarksRouter;
