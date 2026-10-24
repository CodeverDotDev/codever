const sharedResourcePath =
  /((?:\/api)?\/(?:public\/)?(?:bookmarks|notes|snippets)\/shared\/)[^/?#]+/gi;
const legacyShareManagementPath =
  /(\/api\/personal\/users\/[^/?#]+\/(?:bookmarks|notes)\/shareable\/)[^/?#]+/gi;

function redactShareCredentials(value) {
  if (typeof value !== 'string') {
    return value;
  }

  return value
    .replace(sharedResourcePath, '$1[REDACTED]')
    .replace(legacyShareManagementPath, '$1[REDACTED]');
}

module.exports = redactShareCredentials;
