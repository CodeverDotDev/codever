const superagent = require("superagent");
const jwt = require("jsonwebtoken");

const common = require('../config');
const HttpStatus = require("http-status-codes");
const config = common.config();

const getAccessToken = async () => {
  const userBearerTokenResponse = await superagent
    .post(config.integration_tests.token_endpoint)
    .send('client_id=' + config.integration_tests.client_id)
    .send('client_secret=' + config.integration_tests.client_secret)
    .send('grant_type=client_credentials')
    .set('Accept', 'application/json');

  const accessToken = userBearerTokenResponse.body.access_token;

  return accessToken;
};


const getBearerToken = accessToken => `Bearer ${accessToken}`;

const getTestUserId = accessToken => {
  const decoded = jwt.decode(accessToken);
  const testUserId = decoded.sub;

  return testUserId;
};

const getBookmarkId = httpResponse => {
  if ( httpResponse.statusCode !== HttpStatus.CREATED ) {
    throw new Error("Sample bookmark not properly created");
  }
  const locationHeaderValue = httpResponse.header['location']

  //set the id of the bookmarkexample now that it is created
  const lastSlashIndex = locationHeaderValue.lastIndexOf('/');
  return locationHeaderValue.substring(lastSlashIndex + 1);
}

const generateTextWithNumberLines = numberLines => {
  const line = 'oneline\n';
  let longText = line;
  for ( let i = 0; i < numberLines; i++ ) {
    longText += line;
  }

  return longText;
}


module.exports = {
  getTestUserId: getTestUserId,
  getAccessToken: getAccessToken,
  getBearerToken: getBearerToken,
  getBookmarkId: getBookmarkId,
  generateTextWithNumberLines: generateTextWithNumberLines
}
