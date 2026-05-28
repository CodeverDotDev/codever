const express = require('express');
const personalCollectionsRouter = express.Router({ mergeParams: true });
const Keycloak = require('keycloak-connect');

const PersonalCollectionsService = require('./personal-collections.service');
const UserIdValidator = require('../userid.validator');
const PaginationQueryParamsHelper = require('../../../common/pagination-query-params-helper');

const common = require('../../../common/config');
const config = common.config();

const HttpStatus = require('http-status-codes/index');

// Keycloak middleware
const keycloak = new Keycloak({ scope: 'openid' }, config.keycloak);
personalCollectionsRouter.use(keycloak.middleware());

/**
 * CREATE collection
 */
personalCollectionsRouter.post(
  '/',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);
    const newCollection = await PersonalCollectionsService.createCollection(
      request.params.userId,
      request.body
    );

    response
      .set(
        'Location',
        `${config.basicApiUrl}/personal/users/${request.params.userId}/collections/${newCollection.id}`
      )
      .status(HttpStatus.CREATED)
      .send(newCollection);
  }
);

/**
 * GET user's collections (with optional ?q= name filter and pagination)
 */
personalCollectionsRouter.get(
  '/',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);
    const searchText = request.query.q;
    const { page, limit } =
      PaginationQueryParamsHelper.getPageAndLimit(request);

    const collections = await PersonalCollectionsService.getUserCollections(
      request.params.userId,
      searchText,
      page || 1,
      limit || 20
    );

    return response.status(HttpStatus.OK).send(collections);
  }
);

/**
 * GET collections containing a specific resource (for dialog checkbox state)
 */
personalCollectionsRouter.get(
  '/containing/:resourceId',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);
    const { userId, resourceId } = request.params;
    const collections =
      await PersonalCollectionsService.getCollectionsContainingResource(
        userId,
        resourceId
      );

    return response.status(HttpStatus.OK).send(collections);
  }
);

/**
 * GET single collection by ID
 */
personalCollectionsRouter.get(
  '/:collectionId',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);
    const { userId, collectionId } = request.params;
    const collection = await PersonalCollectionsService.getCollectionById(
      userId,
      collectionId
    );

    return response.status(HttpStatus.OK).send(collection);
  }
);

/**
 * UPDATE collection metadata (name, description, color)
 */
personalCollectionsRouter.put(
  '/:collectionId',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);
    const { userId, collectionId } = request.params;
    const updatedCollection =
      await PersonalCollectionsService.updateCollection(
        userId,
        collectionId,
        request.body
      );

    return response.status(HttpStatus.OK).send(updatedCollection);
  }
);

/**
 * DELETE collection (does NOT delete the bookmarks/notes inside)
 */
personalCollectionsRouter.delete(
  '/:collectionId',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);
    const { userId, collectionId } = request.params;
    await PersonalCollectionsService.deleteCollectionById(userId, collectionId);

    return response.status(HttpStatus.NO_CONTENT).send();
  }
);

/**
 * ADD item (bookmark or note) to collection
 * Body: { resourceId: "...", resourceType: "bookmark" | "note" }
 */
personalCollectionsRouter.post(
  '/:collectionId/items',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);
    const { userId, collectionId } = request.params;
    const { resourceId, resourceType } = request.body;

    const updatedCollection =
      await PersonalCollectionsService.addItemToCollection(
        userId,
        collectionId,
        resourceId,
        resourceType
      );

    return response.status(HttpStatus.OK).send(updatedCollection);
  }
);

/**
 * REMOVE item from collection
 */
personalCollectionsRouter.delete(
  '/:collectionId/items/:resourceId',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);
    const { userId, collectionId, resourceId } = request.params;

    const updatedCollection =
      await PersonalCollectionsService.removeItemFromCollection(
        userId,
        collectionId,
        resourceId
      );

    return response.status(HttpStatus.OK).send(updatedCollection);
  }
);

module.exports = personalCollectionsRouter;

