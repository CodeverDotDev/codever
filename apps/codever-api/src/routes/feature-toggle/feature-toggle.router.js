const express = require('express');
const router = express.Router();

const common = require('../../common/config');
const config = common.config();
const Keycloak = require('keycloak-connect');
const keycloak = new Keycloak({ scope: 'openid' }, config.keycloak);
router.use(keycloak.middleware());

const FeatureToggleService = require('../../common/feature-toggle.service');

/**
 * GET /api/feature-toggle/ai-note-refine
 *
 * Returns whether the AI note refine feature is enabled for the
 * currently authenticated user.
 */
router.get(
  '/ai-note-refine',
  keycloak.protect(),
  function (request, response) {
    const userId = request.kauth.grant.access_token.content.sub;
    const enabled = FeatureToggleService.isAiNoteRefineEnabled(userId);
    return response.json({ enabled });
  }
);

module.exports = router;
