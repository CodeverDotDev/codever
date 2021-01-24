const express = require('express');
const personalCodeletsRouter = express.Router({mergeParams: true});
const Keycloak = require('keycloak-connect');

const PersonalCodeletsService = require('./personal-codelets.service');
const SnippetsSearchService = require('../../../common/snippets-search.service');
const UserIdValidator = require('../userid.validator');
const PaginationQueryParamsHelper = require('../../../common/pagination-query-params-helper');

const common = require('../../../common/config');
const config = common.config();

const HttpStatus = require('http-status-codes/index');

//add keycloak middleware
const keycloak = new Keycloak({scope: 'openid'}, config.keycloak);
personalCodeletsRouter.use(keycloak.middleware());

/**
 * CREATE snippet for user
 */
personalCodeletsRouter.post('/', keycloak.protect(), async (request, response) => {

  UserIdValidator.validateUserId(request);
  const codeletData = request.body;
  let newSnippet = await PersonalCodeletsService.createCodelet(request.params.userId, codeletData);

  response
    .set('Location', `${config.basicApiUrl}/personal/users/${request.params.userId}/bookmarks/${newSnippet.id}`)
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

/**
 * Find personal snippets
 */
personalCodeletsRouter.get('/', keycloak.protect(), async (request, response, next) => {
  UserIdValidator.validateUserId(request);

  const searchText = request.query.q;
  const searchInclude = request.query.include || 'all';
  const {page, limit} = PaginationQueryParamsHelper.getPageAndLimit(request);

  const {userId} = request.params;
  if ( searchText ) {
    const snippets = await SnippetsSearchService.findSnippets(userId, searchText, page, limit, searchInclude);

    return response.status(HttpStatus.OK).send(snippets);
  } else {
    next();
  }
});

/*
 * Different others filters in case search in not involved
 */
/**
 * Find personal snippets
 */
personalCodeletsRouter.get('/', keycloak.protect(), async (request, response) => {
  UserIdValidator.validateUserId(request);

  const {userId} = request.params;
  const {limit} = PaginationQueryParamsHelper.getPageAndLimit(request);
  const snippets = await PersonalCodeletsService.getLatestSnippets(userId, limit || 30);

  return response.status(HttpStatus.OK).send(snippets);
});

/* GET codelet of user */
personalCodeletsRouter.get('/:snippetId', keycloak.protect(), async (request, response) => {
  UserIdValidator.validateUserId(request);

  const {userId, snippetId: snippetId} = request.params;
  const codelet = await PersonalCodeletsService.getCodeletById(userId, snippetId);

  return response.status(HttpStatus.OK).send(codelet);
});

/**
 * full UPDATE via PUT - that is the whole document is required and will be updated
 * the descriptionHtml parameter is only set in backend, if only does not come front-end (might be an API call)
 */
personalCodeletsRouter.put('/:snippetId', keycloak.protect(), async (request, response) => {

  UserIdValidator.validateUserId(request);

  const codeletData = request.body;

  const {userId, snippetId} = request.params;
  const updatedBookmark = await PersonalCodeletsService.updateCodelet(userId, snippetId, codeletData);

  return response.status(HttpStatus.OK).send(updatedBookmark);
});

/*
* DELETE bookmark for user
*/
personalCodeletsRouter.delete('/:snippetId', keycloak.protect(), async (request, response) => {

  UserIdValidator.validateUserId(request);
  const {userId, snippetId} = request.params;
  await PersonalCodeletsService.deleteCodeletById(userId, snippetId);
  return response.status(HttpStatus.NO_CONTENT).send();
});

module.exports = personalCodeletsRouter;
