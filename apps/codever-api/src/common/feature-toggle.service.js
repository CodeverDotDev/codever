const path = require('path');
const fs = require('fs');

// Path to feature-toggles.json — resolved relative to this file's directory
const togglesPath = path.resolve(__dirname, '../../feature-toggles.json');

/**
 * Read the feature-toggles.json file and check if a given userId
 * is in the enabledUserIds list for the aiNoteRefine feature.
 *
 * @param {string} userId - The Keycloak user ID to check
 * @returns {boolean}
 */
const isAiNoteRefineEnabled = function (userId) {
  try {
    const raw = fs.readFileSync(togglesPath, 'utf-8');
    const toggles = JSON.parse(raw);

    if (
      toggles &&
      toggles.aiNoteRefine &&
      Array.isArray(toggles.aiNoteRefine.enabledUserIds)
    ) {
      return toggles.aiNoteRefine.enabledUserIds.includes(userId);
    }
  } catch (err) {
    console.error('Error reading feature-toggles.json:', err.message);
  }

  return false;
};

module.exports = {
  isAiNoteRefineEnabled,
};
