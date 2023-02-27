const app = require('../../app');
const request = require('supertest');
const HttpStatus = require('http-status-codes/index');


const common = require('../../common/config');


const {toInclude} = require('jest-extended');
const {getAccessToken, getBearerToken, getTestUserId} = require("../../common/testing/test.utils");
expect.extend({toInclude});

/**
 * Order of tests is important (example user will be first created/updated to eventually be deleted)
 */
describe('User Data tests',  () => {

  let bearerToken;
  let testUserId;
  const baseApiUrlUnderTest = '/api/personal/users';

  const starredBookmarkId = "bookmarkid-3443";

  const searchTextExample = 'nodejs rocks';
  let userExample;

  beforeAll(async () => {
    try {
      const accessToken = await getAccessToken();
      bearerToken = getBearerToken(accessToken);
      testUserId = getTestUserId(accessToken);

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

    expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
  });

  it('should fail trying to GET data for not existing user', async function () {
    const response = await request(app)
      .get(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken);

    expect(response.statusCode).toEqual(HttpStatus.NOT_FOUND);
  });

  it('should fail trying to UPDATE user without userId in the body', async function () {
    let invalidUser = JSON.parse(JSON.stringify(userExample));
    delete invalidUser.userId;

    const response = await request(app)
      .put(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken);

    expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
    expect(response.body.validationErrors).toInclude('Missing or invalid userId in provided user data');
  });

  it('should fail trying to UPDATE with invalid user Id in the body', async function () {
    let invalidUser = JSON.parse(JSON.stringify(userExample));
    invalidUser.userId = 'invalid_user_id';

    const response = await request(app)
      .put(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken);

    expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
    expect(response.body.validationErrors).toInclude('Missing or invalid userId in provided user data');
  });

  it('should successfully UPDATE example user without searches', async function () {
    let newUser = JSON.parse(JSON.stringify(userExample));
    newUser.searches = [];

    const response = await request(app)
      .put(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken)
      .send(newUser);

    expect(response.statusCode).toEqual(HttpStatus.OK);
    expect(response.body.userId).toEqual(testUserId);
    expect(response.body.searches.length).toEqual(0);
  });

  it('should fail trying to UPDATE example user with invalid searches', async function () {
    let userWithInvalidSearches = JSON.parse(JSON.stringify(userExample));
    userWithInvalidSearches.searches.push({"text": "", "lastAccessedAt": "2019-01-28T05:47:47.652Z"});

    const response = await request(app)
      .put(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken)
      .send(userWithInvalidSearches);

    expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
    expect(response.body.validationErrors).toInclude('Searches are not valid - search text is required');

  });

  it('should successfully UPDATE example user with searches', async function () {
    const response = await request(app)
      .put(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken)
      .send(userExample);

    expect(response.statusCode).toEqual(HttpStatus.OK);
    expect(response.body.userId).toEqual(testUserId);
    expect(response.body.searches).toHaveLength(1);
    expect(response.body.searches[0].text).toEqual(searchTextExample);
  });

  it('should successfully UPDATE example user new starred bookmark', async function () {
    let userExampleWithStars = JSON.parse(JSON.stringify(userExample));
    userExampleWithStars.likes = [starredBookmarkId];

    const response = await request(app)
      .put(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken)
      .send(userExampleWithStars);

    expect(response.statusCode).toEqual(HttpStatus.OK);
    expect(response.body.userId).toEqual(testUserId);
    expect(response.body.likes).toHaveLength(1);
    expect(response.body.likes[0]).toEqual(starredBookmarkId);
  });

  it('should now successfully READ created/updated user', async function () {
    const response = await request(app)
      .get(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken);

    expect(response.statusCode).toEqual(HttpStatus.OK);
    expect(response.body.userId).toEqual(testUserId);
    expect(response.body.searches).toHaveLength(1);
    expect(response.body.searches[0].text).toEqual(searchTextExample);
    expect(response.body.likes[0]).toEqual(starredBookmarkId);

  });

  it('should succeed to DELETE the new created user', async function () {
    const response = await request(app)
      .delete(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken);

    expect(response.statusCode).toEqual(HttpStatus.NO_CONTENT);
  });


  it('should fail trying to DELETE the already deleted user', async function () {
    const response = await request(app)
      .delete(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken);

    expect(response.statusCode).toEqual(HttpStatus.NOT_FOUND);
  });


});
