const ValidationError = require('../../error/validation.error');

const MAX_TAGS = 13;
const RECOMMENDED_AI_TAGS = 8;
const AI_TAG_GUIDANCE =
  `Strongly prefer at most ${RECOMMENDED_AI_TAGS} relevant tags where possible ` +
  `(lowercase, hyphenated for multi-word). The hard ceiling is ${MAX_TAGS} unique tags; ` +
  'use more than eight only when justified or explicitly requested. ' +
  'Do not remove existing tags merely to meet the recommendation.';
const INVALID_TAGS = 'Tags must be an array of nonempty strings';
const TOO_MANY_TAGS = `Too many tags - max ${MAX_TAGS} allowed`;

/** Normalize before counting; never truncate or silently drop invalid tags. */
function normalizeTags(tags = []) {
  if (
    !Array.isArray(tags) ||
    tags.some((tag) => typeof tag !== 'string' || !tag.trim())
  ) {
    throw new ValidationError('The tags you submitted are not valid', [INVALID_TAGS]);
  }

  const normalized = [...new Set(tags.map((tag) => tag.trim().toLowerCase()))];
  if (normalized.length > MAX_TAGS) {
    throw new ValidationError('The tags you submitted are not valid', [TOO_MANY_TAGS]);
  }

  return normalized;
}

module.exports = {
  MAX_TAGS,
  RECOMMENDED_AI_TAGS,
  AI_TAG_GUIDANCE,
  INVALID_TAGS,
  TOO_MANY_TAGS,
  normalizeTags,
};
