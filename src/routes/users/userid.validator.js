const Token = require('keycloak-connect/middleware/auth-utils/token');
const UseridTokenValidationError = require('./userid-validation.error');

let validateUserId = function (request) {
  const userId = request.kauth.grant.access_token.content.sub;
  if (userId !== request.params.userId) {
    throw new UseridTokenValidationError('the userId does not match the subject in the access token');
  }
}

let validateIsAdminOrUserId = function (request) {
  const token = new Token(request.kauth.grant.access_token.token, 'bookmarks-api');
  const isNotAdmin = !token.hasRealmRole('ROLE_ADMIN');
  if (isNotAdmin) {
    validateUserId(request);
  }
}


module.exports = {
  validateUserId: validateUserId,
  validateIsAdminOrUserId: validateIsAdminOrUserId
};
