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
          'Not Found Error',
          ['User with the userId ' + request.params.userId + ' was not found']
          )
        );
    } else {
      response.status(HttpStatus.OK).send(userData);
    }

  } catch (err) {
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(err);
  }
});


module.exports = usersRouter;
