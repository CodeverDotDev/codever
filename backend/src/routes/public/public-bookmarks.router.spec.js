const app = require('../../app');
const request = require('supertest');
const HttpStatus = require('http-status-codes/index');
const jwt = require('jsonwebtoken');

const common = require('../../common/config');
const config = common.config();

const superagent = require('superagent');

const basePathApiPublicBookmarks = '/api/public/bookmarks/';

const { faker } = require('@faker-js/faker');


let generateBookmark = function (verySpecialTitle, verySpecialLocation, verySpecialTag, verySpecialSourceCodeUrl, testUserId, isPublic) {
  return {
    "name": verySpecialTitle,
    "location": faker.internet.url(),
    "language": "en",
    "tags": [
      verySpecialTag,
      "async-await",
      "mongoose",
      "mongodb"
    ],
    "publishedOn": "2017-11-05",
    "sourceCodeURL": verySpecialSourceCodeUrl,
    "description": "This is a very special bookmark used for testing the search functionality. Indeed very-special-bookmark",
    "descriptionHtml": "<p>This is a very special bookmark used for testing the search functionality. Indeed very-special-bookmark</p>",
    "userId": testUserId,
    "public": isPublic,
    "likeCount": 0,
    "lastAccessedAt": null
  }
};
describe('Public API Tests', () => {

  describe('get public bookmarks root endpoint tests', () => {

    it('should return all public bookmarks', async () => {
      const response = await request(app)
        .get(basePathApiPublicBookmarks);

      expect(response.statusCode).toEqual(HttpStatus.OK);
    });

    it('should not find bookmark by location', async () => {
      const response = await request(app)
        .get(basePathApiPublicBookmarks)
        .query({location: 'unknown-url'});

      const foundBookmarks = response.body;
      expect(response.statusCode).toEqual(HttpStatus.OK);
      expect(foundBookmarks.length).toEqual(0);
    });
  });

  describe('Test bookmarks search functionality', function () {

    let bearerToken;
    let createdBookmarkId;
    let testUserId;

    const basePathApiPersonalUsers = '/api/personal/users/';

    const verySpecialTitle = "very special title very-special-java-title - public";
    const verySpecialLocation = "http://www.very-special-url.com/public-api-tests";
    const verySpecialTag = "very-special-tag-public";
    const verySpecialSourceCodeUrl = "https://very-special-github-url.com/public-api-tests";
    let publicBookmarkExample = generateBookmark(verySpecialTitle, verySpecialLocation, verySpecialTag, verySpecialSourceCodeUrl, testUserId, true);

    beforeAll(async () => {
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
        publicBookmarkExample.userId = testUserId;
        try {
          await request(app)
            .delete(`${basePathApiPersonalUsers}${testUserId}/bookmarks`)
            .query({'location': verySpecialLocation})
            .set('Authorization', bearerToken);

          const createBookmarkResponse = await request(app)
            .post(`${basePathApiPersonalUsers}${testUserId}/bookmarks`)
            .set('Authorization', bearerToken)
            .send(publicBookmarkExample);

          if ( createBookmarkResponse.statusCode !== HttpStatus.CREATED ) {
            throw new Error("Sample bookmark not properly created");
          }
          const locationHeaderValue = createBookmarkResponse.header['location']

          //set the id of the bookmarkexample now that it is created
          const lastSlashIndex = locationHeaderValue.lastIndexOf('/');
          createdBookmarkId = locationHeaderValue.substring(lastSlashIndex + 1);
        } catch (err) {
          console.error("Error creating test bookmark", err);
          throw  err;
        }

      } catch (err) {
        console.error('Error when getting user bearer token', err);
        throw err;
      }
    });

    afterAll(async () => {
      await request(app)
        .delete(`${basePathApiPersonalUsers}${testUserId}/bookmarks/${createdBookmarkId}`)
        .set('Authorization', bearerToken);
    });

    test.each([
      [`${verySpecialTag}`],
      [`${verySpecialTag} lang:en site:${publicBookmarkExample.location}`],
      [`${verySpecialTag} site:${publicBookmarkExample.location}`],
      [`${verySpecialTag} lang:en`],
      [`${publicBookmarkExample.location}`],
      [`${verySpecialSourceCodeUrl}`],
      [`${verySpecialTitle}`],
      [`[${verySpecialTag}]`],
      [`${verySpecialTag} [${verySpecialTag}]`],
    ])('given query %p it should find expected bookmark', async (query) => {
      const response = await request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: query})
        .query({limit: 10});
      expect(response.statusCode).toEqual(HttpStatus.OK);
      const filteredBookmarks = response.body;
      expect(filteredBookmarks.length).toEqual(1);
      const foundBookmark = filteredBookmarks[0];
      expect(foundBookmark.name).toEqual(publicBookmarkExample.name);
      expect(foundBookmark.userId).toEqual(testUserId);
      expect(foundBookmark.location).toEqual(publicBookmarkExample.location);
    });

    it('should find bookmark by location query param', async function () {
      const response = await request(app)
        .get(basePathApiPublicBookmarks)
        .query({location: verySpecialLocation});

      expect(response.statusCode).toEqual(HttpStatus.OK);
    });

    it('should NOT find bookmark with with very-special-tag in query param as word and false language', async function () {
      const queryText = `${verySpecialTag} lang:de`;
      const response = await request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: queryText})
        .query({limit: 10});

      expect(response.statusCode).toEqual(HttpStatus.OK);
      const filteredBookmarks = response.body;
      expect(filteredBookmarks.length).toEqual(0);
    });


    it('should find bookmark tagged with very-special-tag', async function () {
      const response = await request(app)
        .get(basePathApiPublicBookmarks + 'tagged/' + verySpecialTag);

      expect(response.statusCode).toEqual(HttpStatus.OK);
      const filteredBookmarks = response.body;
      const foundBookmark = filteredBookmarks[0];
      expect(filteredBookmarks.length).toEqual(1);
      expect(foundBookmark.name).toEqual(publicBookmarkExample.name);
    });


    it('should NOT find bookmark with with very-special-tag in query param as word and false site', async function () {
      const queryText = `${verySpecialTag} site:not-existing-domain.com`;
      const response = await request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: queryText})
        .query({limit: 10});

      expect(response.statusCode).toEqual(HttpStatus.OK);
      const filteredBookmarks = response.body;
      expect(filteredBookmarks.length).toEqual(0);
    });

    it('should find bookmark with with very-special-tag in query param as word and user', async function () {
      const queryText = `${verySpecialTag} user:${testUserId}`
      const response = await request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: queryText})
        .query({limit: 10});

      expect(response.statusCode).toEqual(HttpStatus.OK);
      const filteredBookmarks = response.body;
      const foundBookmark = filteredBookmarks[0];
      expect(filteredBookmarks.length).toEqual(1);
      expect(foundBookmark.name).toEqual(verySpecialTitle);
    });


    it('should find bookmark with with very-special-tag in query param only as tag and user', async function () {
      const queryText = `[${verySpecialTag}] user:${testUserId}`
      const response = await request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: queryText})
        .query({limit: 10});

      expect(response.statusCode).toEqual(HttpStatus.OK);
      const filteredBookmarks = response.body;
      const foundBookmark = filteredBookmarks[0];
      expect(filteredBookmarks.length).toEqual(1);
      expect(foundBookmark.name).toEqual(verySpecialTitle);
    });


    it('should find bookmark with with very-special-tag in query param as tag and word plus user', async function () {
      const queryText = `${verySpecialTag} [${verySpecialTag}] user:${testUserId}`;
      const response = await request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: queryText})
        .query({limit: 10});

      expect(response.statusCode).toEqual(HttpStatus.OK);
      const filteredBookmarks = response.body;
      const foundBookmark = filteredBookmarks[0];
      expect(filteredBookmarks.length).toEqual(1);
      expect(foundBookmark.name).toEqual(verySpecialTitle);
    });


  });
});

