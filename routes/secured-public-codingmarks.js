var express = require('express');
var router = express.Router();
var Keycloak = require('keycloak-connect');

var Bookmark = require('../models/bookmark');
var MyError = require('../models/error');

var common = require('../common/config');
var config = common.config();

var HttpStatus = require('http-status-codes');

//add keycloak middleware
var keycloak = new Keycloak({scope: 'openid'}, config.keycloak);
router.use(keycloak.middleware());

/* rate the codingmark. */
router.patch('/:codingmarkId', keycloak.protect(), async (request, response) => {

  let userId = request.kauth.grant.access_token.content.sub;
  if (userId !== request.body.ratingUserId) {
    return response.status(HttpStatus.UNAUTHORIZED).send(new MyError('Invalid userId', ['The id from the access token must match the one from the request']));
  }
  const requiredAttributesMissing = !request.body.action || !request.body.ratingUserId;
  if (requiredAttributesMissing) {
    return response
      .status(HttpStatus.BAD_REQUEST)
      .send(new MyError('Missing required attributes', ['Missing required attributes']));
  }

  if (request.body.action === 'STAR') {
    try {
      const codingmark = await Bookmark.findOneAndUpdate({_id: request.params.codingmarkId}, {$addToSet: {starredBy: request.body.ratingUserId}});

      const codingmarkNotFound = !codingmark;
      if (codingmarkNotFound) {
        return response
          .status(HttpStatus.NOT_FOUND)
          .send(new MyError('Not Found Error', ['Codingmark with codingmark id ' + request.params.codingmarkId + ' not found']));
      } else {
        response
          .status(HttpStatus.OK)
          .send(codingmark);
      }
    } catch (err) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(new MyError('Unknown Server Error', ['Unknow server error when starring codingmark with id ' + request.params.codingmarkId]));
    }
  } else if (request.body.action === 'UNSTAR') {
    try {
      const codingmark = await Bookmark.findOneAndUpdate({_id: request.params.codingmarkId}, {$pull: {starredBy: request.body.ratingUserId}});

      const codingmarkNotFound = !codingmark;
      if (codingmarkNotFound) {
        return response
          .status(HttpStatus.NOT_FOUND)
          .send(new MyError('Not Found Error', ['Codingmark with codingmark id ' + request.params.codingmarkId + ' not found']));
      } else {
        response
          .status(HttpStatus.OK)
          .send(codingmark);
      }
    } catch (err) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(new MyError('Unknown Server Error', ['Unknow server error when unstarring codingmark with id ' + request.params.codingmarkId]));
    }
  } else {
    return response
      .status(HttpStatus.BAD_REQUEST)
      .send(new MyError('Rating action should be either STAR or UNSTAR', ['Rating action should be either STAR or UNSTAR']));
  }

});

module.exports = router;
