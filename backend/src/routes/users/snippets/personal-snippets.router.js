const express = require('express');
const personalSnippetsRouter = express.Router({mergeParams: true});
const Keycloak = require('keycloak-connect');

const PersonalSnippetsService = require('./personal-snippets.service');
const SnippetsSearchService = require('../../../common/snippets-search.service');
const UserIdValidator = require('../userid.validator');
const PaginationQueryParamsHelper = require('../../../common/pagination-query-params-helper');

const common = require('../../../common/config');
const config = common.config();

const HttpStatus = require('http-status-codes/index');

//add keycloak middleware
const keycloak = new Keycloak({scope: 'openid'}, config.keycloak);
personalSnippetsRouter.use(keycloak.middleware());

/**
 * CREATE snippet for user
 */
personalSnippetsRouter.post('/', keycloak.protect(), async (request, response) => {

  UserIdValidator.validateUserId(request);
  const codeletData = request.body;
  let newSnippet = await PersonalSnippetsService.createSnippet(request.params.userId, codeletData);

  response
    .set('Location', `${config.basicApiUrl}/personal/users/${request.params.userId}/snippets/${newSnippet.id}`)
    .status(HttpStatus.CREATED)
    .send({response: 'Snippet created for userId ' + request.params.userId});

});

/**
 * GET suggested tags used by user
 *
 * Order matters - needs to be GET snippet by id
 **/
personalSnippetsRouter.get('/suggested-tags', keycloak.protect(), async (request, response) => {
  UserIdValidator.validateUserId(request);
  const tags = await PersonalSnippetsService.getSuggestedSnippetTags(request.params.userId);

  response.send(tags);
});

/**
 * GET all snippets of a user, ordered by createdAt date descending
 **/
personalSnippetsRouter.get('/export', keycloak.protect(), async (request, response) => {
  UserIdValidator.validateUserId(request);
  const snippets = await PersonalSnippetsService.getAllMySnippets(request.params.userId);

  response.send(snippets);
});

/**
 * Find personal snippets
 */
personalSnippetsRouter.get('/', keycloak.protect(), async (request, response, next) => {
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
personalSnippetsRouter.get('/', keycloak.protect(), async (request, response) => {
  UserIdValidator.validateUserId(request);

  const {userId} = request.params;
  const {limit} = PaginationQueryParamsHelper.getPageAndLimit(request);
  const snippets = await PersonalSnippetsService.getLatestSnippets(userId, limit || 20);

  return response.status(HttpStatus.OK).send(snippets);
});

/* GET snippet of user */
personalSnippetsRouter.get('/:snippetId', keycloak.protect(), async (request, response) => {
  UserIdValidator.validateUserId(request);

  const {userId, snippetId: snippetId} = request.params;
  const snippet = await PersonalSnippetsService.getSnippetById(userId, snippetId);

  return response.status(HttpStatus.OK).send(snippet);
});

/**
 * full UPDATE via PUT - that is the whole document is required and will be updated
 * the descriptionHtml parameter is only set in backend, if only does not come front-end (might be an API call)
 */
personalSnippetsRouter.put('/:snippetId', keycloak.protect(), async (request, response) => {

  UserIdValidator.validateUserId(request);

  const codeletData = request.body;

  const {userId, snippetId} = request.params;
  const updatedBookmark = await PersonalSnippetsService.updateSnippet(userId, snippetId, codeletData);

  return response.status(HttpStatus.OK).send(updatedBookmark);
});

/*
* DELETE bookmark for user
*/
personalSnippetsRouter.delete('/:snippetId', keycloak.protect(), async (request, response) => {

  UserIdValidator.validateUserId(request);
  const {userId, snippetId} = request.params;
  await PersonalSnippetsService.deleteSnippetById(userId, snippetId);
  return response.status(HttpStatus.NO_CONTENT).send();
});

module.exports = personalSnippetsRouter;
