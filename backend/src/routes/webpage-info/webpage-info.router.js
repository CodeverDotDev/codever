const express = require('express');
const router = express.Router();

const ValidationError = require('../../error/validation.error');

const WebPageInfoService = require('./webpage-info.service');

const common = require('../../common/config');
const config = common.config();
const Keycloak = require('keycloak-connect');
const keycloak = new Keycloak({scope: 'openid'}, config.keycloak);
router.use(keycloak.middleware());


/* scrape URL for data */
router.get('/scrape', keycloak.protect('realm:ROLE_USER'), async function (request, response, next) {
  const location = request.query.location;
  if (location) {
    const webpageData = await WebPageInfoService.getScrapedDataForLocation(location);

    return response.send(webpageData);
  } else {
    next();
  }
});

/* GET youtube video data */
router.get('/scrape', keycloak.protect('realm:ROLE_USER'), async function (request, response, next) {
  const youtubeVideoId = request.query.youtubeVideoId;
  if (youtubeVideoId) {
    const webpageData = await WebPageInfoService.getYoutubeVideoData(youtubeVideoId)

    return response.send(webpageData);
  } else {
    next();
  }
});

/* GET stackoverflow question data */
router.get('/scrape', keycloak.protect('realm:ROLE_USER'), async function (request, response, next) {
  const stackoverflowQuestionId = request.query.stackoverflowQuestionId;
  if (stackoverflowQuestionId) {
    const webpageData = await WebPageInfoService.getStackoverflowQuestionData(stackoverflowQuestionId)

    return response.send(webpageData);
  } else {
    next();
  }
});

/* GET title of bookmark given its url */
router.get('/scrape', keycloak.protect('realm:ROLE_USER'), async function () {
  throw new ValidationError('Missing parameters - url or youtubeVideoId',
    ['You need to provide the url to scrape for or the youtubeVideoId']);
});

/**
 *  GET bookmark by id.
 *  This needs to be the last call to avoid to "tagged" and "scrape" endpoints, which throw then errors
 */

router.get('/:id', async function (request, response) {
  const bookmark = await WebPageInfoService.getBookmarkById(request.params.id);
  response.send(bookmark);
});


module.exports = router;
