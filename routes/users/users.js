var express = require('express');
const usersRouter = express.Router();
const personalCodingmarksRouter = require('./personal-codingmarks');

var Keycloak = require('keycloak-connect');

const User = require('../../models/user');
var MyError = require('../../models/error');

var common = require('../../common/config');
var config = common.config();

var HttpStatus = require('http-status-codes');

//showdown converter - https://github.com/showdownjs/showdown
var showdown = require('showdown'),
  converter = new showdown.Converter();

//add keycloak middleware
var keycloak = new Keycloak({scope: 'openid'}, config.keycloak);
usersRouter.use(keycloak.middleware());

usersRouter.use('/:userId/codingmarks', personalCodingmarksRouter);


/* GET personal codingmarks of the user */
usersRouter.get('/:userId', keycloak.protect(), async (request, response) => {
  try {
    let userId = request.kauth.grant.access_token.content.sub;
    if (userId !== request.params.userId) {
      return response
        .status(HttpStatus.UNAUTHORIZED)
        .send(new MyError('Unauthorized', ['the userId does not match the subject in the access token']));
    }

    const userData = await User.findOne({
      userId: request.params.userId
    });

    if (!userData) {
      return response
        .status(HttpStatus.NOT_FOUND)
        .send(new MyError(
          'User data was not found',
          ['User data of the user with the userId ' + request.params.userId + ' was not found']
          )
        );
    } else {
      response.status(HttpStatus.OK).json(userData);
    }

  } catch (err) {
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(err);
  }
});


/* UPDATE user details
* If users data is not present it will be created (upsert=true)
*
* */
usersRouter.put('/:userId', keycloak.protect(), async (request, response) => {
  try {

    let userId = request.kauth.grant.access_token.content.sub;

    const userIdIsInconsistentInPathAndAccessToken = userId !== request.params.userId;
    if (userIdIsInconsistentInPathAndAccessToken) {
      return response
        .status(HttpStatus.UNAUTHORIZED)
        .send(new MyError('Unauthorized', ['the userId does not match the subject in the access token']));
    }

    const invalidUserIdInRequestBody = !request.body.userId || request.body.userId != userId;
    if (invalidUserIdInRequestBody) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .send(new MyError('Missing or invalid userId in the request body',
          ['the userId must be consistent across path, body and access token']));
    }

    if(!searchesAreValid(request)){
      return response
        .status(HttpStatus.BAD_REQUEST)
        .send(new MyError('Searches are not valid',
          ['Searches are not valid - search text is required']));
    }

    delete request.body._id;//once we proved it's present we delete it to avoid the following MOngoError by findOneAndUpdate
    // MongoError: After applying the update to the document {_id: ObjectId('5c513150e13cda73420a9602') , ...}, the (immutable) field '_id' was found to have been altered to _id: "5c513150e13cda73420a9602"
    const userData = await User.findOneAndUpdate(
      {userId: request.params.userId},
      request.body,
      {upsert: true, new: true}, // option
    );
    response.status(HttpStatus.OK).send(userData);

  } catch (err) {
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(err);
  }
});

function searchesAreValid(request) {
  const searches = request.body.searches;
  if(searches && searches.length > 0 ) {
    for (let i = 0; i < searches.length; i++) {
      if(!searches[i].text) {
        return false;
      }
    }
  }

  return true;
}


/*
* DELETE bookmark for user
*/
usersRouter.delete('/:userId', keycloak.protect(), async (request, response) => {

  const userId = request.kauth.grant.access_token.content.sub;
  if (userId !== request.params.userId) {
    return response
      .status(HttpStatus.UNAUTHORIZED)
      .send(new MyError('Unauthorized', ['the userId does not match the subject in the access token']));
  }

  try {
    const userData = await User.findOneAndRemove({
      userId: request.params.userId
    });

    if (!userData) {
      return response
        .status(HttpStatus.NOT_FOUND)
        .send(new MyError(
          'Not Found Error',
          ['User Data for user id was not found']
          )
        );
    } else {
      response.status(HttpStatus.NO_CONTENT).send();
    }
  } catch (err) {
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(new MyError('Unknown server error',
        ['Unknown server error when trying to delete codingmark with id ' + request.params.codingmarkId]));
  }
});

module.exports = usersRouter;
