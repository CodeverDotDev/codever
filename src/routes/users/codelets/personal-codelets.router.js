const express = require('express');
const personalCodeletsRouter = express.Router({mergeParams: true});
const Keycloak = require('keycloak-connect');

const PersonalCodeletsService = require('./personal-codelets.service');
const PersonalCodeletsSearchService = require('./personal-codelets-search.service');
const UserIdValidator = require('../userid.validator');
const PaginationQueryParamsHelper = require('../../../common/pagination-query-params-helper');

const common = require('../../../common/config');
const config = common.config();

const HttpStatus = require('http-status-codes/index');

//add keycloak middleware
const keycloak = new Keycloak({scope: 'openid'}, config.keycloak);
personalCodeletsRouter.use(keycloak.middleware());

/**
 * CREATE codelet for user
 */
personalCodeletsRouter.post('/', keycloak.protect(), async (request, response) => {

  UserIdValidator.validateUserId(request);
  const codeletData = request.body;
  let newBookmark = await PersonalCodeletsService.createCodelet(request.params.userId, codeletData);

  response
    .set('Location', `${config.basicApiUrl}/personal/users/${request.params.userId}/bookmarks/${newBookmark.id}`)
    .status(HttpStatus.CREATED)
    .send({response: 'Codelet created for userId ' + request.params.userId});

});

/**
 * GET suggested tags used by user
 *
 * Order matters - needs to be GET codelet by id
 **/
personalCodeletsRouter.get('/suggested-tags', keycloak.protect(), async (request, response) => {
  UserIdValidator.validateUserId(request);
  const tags = await PersonalCodeletsService.getSuggestedCodeletTags(request.params.userId);

  response.send(tags);
});

/* GET all personal codelets */
personalCodeletsRouter.get('/', keycloak.protect(), async (request, response) => {
  UserIdValidator.validateUserId(request);


  const searchText = request.query.q;
  const {page, limit} = PaginationQueryParamsHelper.getPageAndLimit(request);

  const {userId} = request.params;
  const codelet = await PersonalCodeletsSearchService.findPersonalCodelets(searchText, page, limit, userId);

  return response.status(HttpStatus.OK).send(codelet);
});


/* GET codelet of user */
personalCodeletsRouter.get('/:codeletId', keycloak.protect(), async (request, response) => {
  UserIdValidator.validateUserId(request);

  const {userId, codeletId} = request.params;
  const codelet = await PersonalCodeletsService.getCodeletById(userId, codeletId);

  return response.status(HttpStatus.OK).send(codelet);
});

/**
 * full UPDATE via PUT - that is the whole document is required and will be updated
 * the descriptionHtml parameter is only set in backend, if only does not come front-end (might be an API call)
 */
personalCodeletsRouter.put('/:codeletId', keycloak.protect(), async (request, response) => {

  UserIdValidator.validateUserId(request);

  const codeletData = request.body;

  const {userId, codeletId} = request.params;
  const updatedBookmark = await PersonalCodeletsService.updateCodelet(userId, codeletId, codeletData);

  return response.status(HttpStatus.OK).send(updatedBookmark);
});

/*
* DELETE bookmark for user
*/
personalCodeletsRouter.delete('/:codeletId', keycloak.protect(), async (request, response) => {

  UserIdValidator.validateUserId(request);
  const {userId, codeletId} = request.params;
  await PersonalCodeletsService.deleteCodeletById(userId, codeletId);
  return response.status(HttpStatus.NO_CONTENT).send();
});

/* GET bookmarks of user */
personalCodeletsRouter.get('/', keycloak.protect(), async (request, response, next) => {
  UserIdValidator.validateUserId(request);

  const searchText = request.query.q;
  const {page, limit} = PaginationQueryParamsHelper.getPageAndLimit(request);
  if ( searchText ) {
    const bookmarks = await personalBookmarksSearchService.findPersonalBookmarks(searchText, page, limit, request.params.userId);
    return response.send(bookmarks);
  } else {
    next();
  }

});

/* GET bookmark of user by location*/
personalCodeletsRouter.get('/', keycloak.protect(), async (request, response, next) => {
  if ( request.query.location ) {
    const bookmark = await PersonalCodeletsService.getPersonalBookmarkByLocation(request.params.userId, request.query.location);
    return response.send(bookmark);
  } else {
    next();
  }
});

/* GET bookmark of user */
personalCodeletsRouter.get('/', keycloak.protect(), async (request, response) => {
  let bookmarks;
  const orderBy = request.query.orderBy;
  const {page, limit} = PaginationQueryParamsHelper.getPageAndLimit(request);
  switch (orderBy) {
    case 'MOST_LIKES':
      bookmarks = await PersonalCodeletsService.getMostLikedBookmarks(request.params.userId, page, limit);
      break;
    case 'LAST_CREATED':
      bookmarks = await PersonalCodeletsService.getLastCreatedBookmarks(request.params.userId, page, limit);
      break;
    case 'MOST_USED':
      bookmarks = await PersonalCodeletsService.getMostUsedBookmarks(request.params.userId);
      break;
    default:
      bookmarks = await PersonalCodeletsService.getLastAccessedBookmarks(request.params.userId);
  }

  return response.send(bookmarks);
});


module.exports = personalCodeletsRouter;
