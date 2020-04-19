const app = require('../../app');
const chai = require('chai');
const request = require('supertest');
const HttpStatus = require('http-status-codes/index');
const expect = chai.expect;
const jwt = require('jsonwebtoken');


const common = require('../../common/config');
const config = common.config();

const superagent = require('superagent');

/**
 * Order of tests is important (example user will be first created/updated to eventually be deleted)
 */
describe('User Data tests', function () {

  let bearerToken;
  let testUserId;
  const baseApiUrlUnderTest = '/api/personal/users';

  const starredBookmarkId = "bookmarkid-3443";

  const searchTextExample = 'nodejs rocks';
  let userExample;

  before(async function () {
    try {
      const userBearerTokenResponse = await
        superagent
          .post(config.integration_tests.token_endpoint)
          .send('client_id=' + config.integration_tests.client_id)
          .send('client_secret=' + config.integration_tests.client_secret)
          .send('grant_type=client_credentials')
          .set('Accept', 'application/json');

      const accessToken = userBearerTokenResponse.body.access_token;
      bearerToken = 'Bearer ' + accessToken;
      const decoded = jwt.decode(accessToken);
      testUserId = decoded.sub;

      userExample = {
        "userId": testUserId,
        "searches": [
          {
            "text": searchTextExample,
            "lastAccessedAt": "2019-01-28T05:47:47.652Z"
          }
        ],
        "readLater": [],
        "likes": [],
        "watchedTags": [],
        "pinned": [],
        "history": []
      }

    } catch (err) {
      console.error('Error when getting user bearer token', err)
    }
  });

  it('should fail trying to GET user details with invalid user id', async function () {
    const response = await request(app)
      .get(baseApiUrlUnderTest + '/invalid-user-id')
      .set('Authorization', bearerToken);

    expect(response.statusCode).to.equal(HttpStatus.UNAUTHORIZED);
  });

  it('should fail trying to GET data for unexisting user', async function () {
    const response = await request(app)
      .get(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken);

    expect(response.statusCode).to.equal(HttpStatus.NOT_FOUND);
  });

  it('should fail trying to UPDATE user without userId in the body', async function () {
    let invalidUser = JSON.parse(JSON.stringify(userExample));
    delete invalidUser.userId;

    const response = await request(app)
      .put(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken);

    expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body.validationErrors).to.include('Missing or invalid userId in provided user data');
  });

  it('should fail trying to UPDATE with invalid user Id in the body', async function () {
    let invalidUser = JSON.parse(JSON.stringify(userExample));
    invalidUser.userId = 'invalid_user_id';

    const response = await request(app)
      .put(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken);

    expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body.validationErrors).to.include('Missing or invalid userId in provided user data');
  });

  it('should successfully UPDATE example user without searches', async function () {
    let newUser = JSON.parse(JSON.stringify(userExample));
    newUser.searches = [];

    const response = await request(app)
      .put(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken)
      .send(newUser);

    expect(response.statusCode).to.equal(HttpStatus.OK);
    expect(response.body.userId).to.equal(testUserId);
    expect(response.body.searches.length).to.equal(0);
  });

  it('should fail trying to UPDATE example user with invalid searches', async function () {
    let userWithInvalidSearches = JSON.parse(JSON.stringify(userExample));
    userWithInvalidSearches.searches.push({"text": "", "lastAccessedAt": "2019-01-28T05:47:47.652Z"});

    const response = await request(app)
      .put(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken)
      .send(userWithInvalidSearches);

    expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body.validationErrors).to.include('Searches are not valid - search text is required');

  });

  it('should successfully UPDATE example user with searches', async function () {
    const response = await request(app)
      .put(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken)
      .send(userExample);

    expect(response.statusCode).to.equal(HttpStatus.OK);
    expect(response.body.userId).to.equal(testUserId);
    expect(response.body.searches).to.have.lengthOf(1);
    expect(response.body.searches[0].text).to.equal(searchTextExample);
  });

  it('should successfully UPDATE example user new starred bookmark', async function () {
    let userExampleWithStars = JSON.parse(JSON.stringify(userExample));
    userExampleWithStars.likes = [starredBookmarkId];

    const response = await request(app)
      .put(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken)
      .send(userExampleWithStars);

    expect(response.statusCode).to.equal(HttpStatus.OK);
    expect(response.body.userId).to.equal(testUserId);
    expect(response.body.likes).to.have.lengthOf(1);
    expect(response.body.likes[0]).to.equal(starredBookmarkId);
  });

  it('should now successfully READ created/updated user', async function () {
    const response = await request(app)
      .get(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken);

    expect(response.statusCode).to.equal(HttpStatus.OK);
    expect(response.body.userId).to.equal(testUserId);
    expect(response.body.searches).to.have.lengthOf(1);
    expect(response.body.searches[0].text).to.equal(searchTextExample);
    expect(response.body.likes[0]).to.equal(starredBookmarkId);

  });

  it('should succeed to DELETE the new created user', async function () {
    const response = await request(app)
      .delete(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken);

    expect(response.statusCode).to.equal(HttpStatus.NO_CONTENT);
  });


  it('should fail trying to DELETE the already deleted user', async function () {
    const response = await request(app)
      .delete(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken);

    expect(response.statusCode).to.equal(HttpStatus.NOT_FOUND);
  });


});
