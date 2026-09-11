const express = require('express');
const router = express.Router();

const common = require('../../common/config');
const config = common.config();
const Keycloak = require('keycloak-connect');
const keycloak = new Keycloak({ scope: 'openid' }, config.keycloak);
router.use(keycloak.middleware());

const FeatureToggleService = require('../../common/feature-toggle.service');

/**
 * GET /api/feature-toggle
 *
 * Returns the enabled state of ALL feature toggles for the currently
 * authenticated user in a single response, e.g.
 * { aiNoteRefine: true, aiAssistant: false, mcpServer: false }.
 */
router.get('/', keycloak.protect(), function (request, response) {
  const userId = request.kauth.grant.access_token.content.sub;
  return response.json(FeatureToggleService.getFeatureToggles(userId));
});


module.exports = router;
