var express = require('express');
const usersRouter = express.Router();
const personalCodingmarksRouter =  require('./personal-codingmarks');

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
usersRouter.use(keycloak.middleware());

usersRouter.use('/:userId/codingmarks', personalCodingmarksRouter);

module.exports = usersRouter;
