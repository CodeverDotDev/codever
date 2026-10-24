const express = require('express');
const Keycloak = require('keycloak-connect');
const HttpStatus = require('http-status-codes/index');

const common = require('../../common/config');
const config = common.config();
const UserIdValidator = require('./userid.validator');
const ValidationError = require('../../error/validation.error');
const ShareLinkService = require('./share-link.service');

const router = express.Router({ mergeParams: true });
const keycloak = new Keycloak({ scope: 'openid' }, config.keycloak);

router.use((request, response, next) => {
  response.set('Cache-Control', 'no-store');
  next();
});
router.use(keycloak.middleware());

router.get('/', keycloak.protect(), async (request, response) => {
  UserIdValidator.validateUserId(request);
  const result = await ShareLinkService.listShareLinks(
    request.params.userId,
    request
  );
  return response.status(HttpStatus.OK).json(result);
});

router.get(
  '/:resourceType/:resourceId',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);
    const result = await ShareLinkService.getShareLinkStatus(
      request.params.userId,
      request.params.resourceType,
      request.params.resourceId
    );
    return response.status(HttpStatus.OK).json(result);
  }
);

router.post(
  '/:resourceType/:resourceId',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);
    const body = request.body;
    if (
      body !== undefined &&
      (typeof body !== 'object' ||
        body === null ||
        Array.isArray(body) ||
        Object.keys(body).length > 0)
    ) {
      throw new ValidationError('Share-link creation body must be empty');
    }

    const result = await ShareLinkService.createShareLink(
      request.params.userId,
      request.params.resourceType,
      request.params.resourceId
    );
    const { created, ...shareLink } = result;
    return response
      .status(created ? HttpStatus.CREATED : HttpStatus.OK)
      .json(shareLink);
  }
);

router.delete(
  '/:shareLinkId',
  keycloak.protect(),
  async (request, response) => {
    UserIdValidator.validateUserId(request);
    await ShareLinkService.revokeShareLink(
      request.params.userId,
      request.params.shareLinkId
    );
    return response.status(HttpStatus.NO_CONTENT).send();
  }
);

module.exports = router;
