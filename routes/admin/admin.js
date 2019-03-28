const express = require('express');
const adminRouter = express.Router();

const Keycloak = require('keycloak-connect');

const Bookmark = require('../../models/bookmark');
const MyError = require('../../models/error');

const common = require('../../common/config');
const config = common.config();

const HttpStatus = require('http-status-codes');

//showdown converter - https://github.com/showdownjs/showdown
const showdown = require('showdown'),
  converter = new showdown.Converter();

//add keycloak middleware
const keycloak = new Keycloak({scope: 'openid'}, config.keycloak);
adminRouter.use(keycloak.middleware());


/* GET all bookmarks */
adminRouter.get('/bookmarks', keycloak.protect('realm:ROLE_ADMIN'), async (request, response) => {
  try {
    let bookmarks;
    if(request.query.public === true) {
      bookmarks = await Bookmark.find({shared: true});
    } else {
      bookmarks = await Bookmark.find({});
    }

    response.send(bookmarks);
  } catch (err) {
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(err);
  }
});

module.exports = adminRouter;
