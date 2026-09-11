const path = require('path');
const fs = require('fs');

// Path to feature-toggles.json — resolved relative to this file's directory
const togglesPath = path.resolve(__dirname, '../../feature-toggles.json');

/**
 * Read the feature-toggles.json file and check if a given userId
 * is in the enabledUserIds list for the named feature.
 *
 * @param {string} featureName - The feature key in feature-toggles.json
 * @param {string} userId - The Keycloak user ID to check
 * @returns {boolean}
 */
const isFeatureEnabled = function (featureName, userId) {
  try {
    const raw = fs.readFileSync(togglesPath, 'utf-8');
    const toggles = JSON.parse(raw);

    if (
      toggles &&
      toggles[featureName] &&
      Array.isArray(toggles[featureName].enabledUserIds)
    ) {
      return toggles[featureName].enabledUserIds.includes(userId);
    }
  } catch (err) {
    console.error('Error reading feature-toggles.json:', err.message);
  }

  return false;
};

/**
 * The set of feature toggles exposed to clients. Keeping this explicit
 * gives the API a stable contract regardless of what's in the JSON file.
 */
const FEATURE_NAMES = ['aiNoteRefine', 'aiAssistant', 'mcpServer'];

/**
 * Read feature-toggles.json once and return the enabled state of every
 * known feature for the given user. Preferred over the single-feature
 * helpers when a client needs several toggles (one file read, one call).
 *
 * @param {string} userId - The Keycloak user ID to check
 * @returns {{ aiNoteRefine: boolean, aiAssistant: boolean, mcpServer: boolean }}
 */
const getFeatureToggles = function (userId) {
  const features = FEATURE_NAMES.reduce((acc, name) => {
    acc[name] = false;
    return acc;
  }, {});

  try {
    const raw = fs.readFileSync(togglesPath, 'utf-8');
    const toggles = JSON.parse(raw);

    FEATURE_NAMES.forEach((name) => {
      if (
        toggles &&
        toggles[name] &&
        Array.isArray(toggles[name].enabledUserIds)
      ) {
        features[name] = toggles[name].enabledUserIds.includes(userId);
      }
    });
  } catch (err) {
    console.error('Error reading feature-toggles.json:', err.message);
  }

  return features;
};

/**
 * Check if the aiNoteRefine feature is enabled for a given userId.
 * Thin wrapper kept for backward compatibility.
 *
 * @param {string} userId - The Keycloak user ID to check
 * @returns {boolean}
 */
const isAiNoteRefineEnabled = function (userId) {
  return isFeatureEnabled('aiNoteRefine', userId);
};

/**
 * Check if the aiAssistant (in-app DeepSeek chat) feature is enabled.
 *
 * @param {string} userId - The Keycloak user ID to check
 * @returns {boolean}
 */
const isAiAssistantEnabled = function (userId) {
  return isFeatureEnabled('aiAssistant', userId);
};

/**
 * Check if the mcpServer feature is enabled for a given userId.
 *
 * @param {string} userId - The Keycloak user ID to check
 * @returns {boolean}
 */
const isMcpServerEnabled = function (userId) {
  return isFeatureEnabled('mcpServer', userId);
};

module.exports = {
  isFeatureEnabled,
  getFeatureToggles,
  isAiNoteRefineEnabled,
  isAiAssistantEnabled,
  isMcpServerEnabled,
};
