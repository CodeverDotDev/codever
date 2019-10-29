const app = require('../app');
const chai = require('chai');
const request = require('supertest');
const HttpStatus = require('http-status-codes');
const expect = chai.expect;
const jwt = require('jsonwebtoken');

const common = require('../common/config');
const config = common.config();

const superagent = require('superagent');

describe('Public API Tests', function () {

  describe('get public bookmarks root endpoint tests', function () {
    const publicBookmarksApiBaseUrl = '/api/public/bookmarks';

    it('should return all public bookmarks', function (done) {
      request(app)
        .get(publicBookmarksApiBaseUrl)
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.OK);
          done();
        });
    });

    it('should not find bookmark by location', function (done) {
      request(app)
        .get(publicBookmarksApiBaseUrl)
        .query({location: 'unknown_url'})
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.NOT_FOUND);
          done();
        });
    });
  });

  describe('Test search functionality', function () {

    let bearerToken;
    let createdBookmarkId;

    let testUserId;
    const basePathApiPersonalUsers = '/api/personal/users/';

    const basePathApiPublicBookmarks = '/api/public/bookmarks/';

    const verySpecialTitle = "very special title very-special-java-title";
    const verySpecialLocation = "http://www.very-special-url.com/public-api-tests";
    const verySpecialTag = "very-special-tag";
    const verySpecialSourceCodeUrl = "https://very-special-github-url.com";
    let bookmarkExample;

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

        bookmarkExample = {
          "name": verySpecialTitle,
          "location": verySpecialLocation,
          "language": "en",
          "tags": [
            verySpecialTag,
            "async-await",
            "mongoose",
            "mongodb"
          ],
          "publishedOn": "2017-11-05",
          "githubURL": verySpecialSourceCodeUrl,
          "description": "This is a very special bookmark used for testing the search functionality. Indeed very-special-bookmark",
          "descriptionHtml": "<p>This is a very special bookmark used for testing the search functionality. Indeed very-special-bookmark</p>",
          "userId": testUserId,
          "shared": true,
          "starredBy": [],
          "likes": 0,
          "lastAccessedAt": null
        }

        try {
          const createBookmarkResponse = await request(app)
            .post(`${basePathApiPersonalUsers}${testUserId}/bookmarks`)
            .set('Authorization', bearerToken)
            .send(bookmarkExample);

          if(createBookmarkResponse.statusCode !== HttpStatus.CREATED) {
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

   after(async function () {
      await request(app)
        .delete(`${basePathApiPersonalUsers}${testUserId}/bookmarks/${createdBookmarkId}`)
        .set('Authorization', bearerToken);
    });

    it('should find bookmark by location query param', function (done) {
      request(app)
        .get(basePathApiPublicBookmarks)
        .query({location: verySpecialLocation})
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.OK);
          done();
        });
    });

    it('should find bookmark tagged with very-special-tag', function (done) {
      request(app)
        .get(basePathApiPublicBookmarks + 'tagged/' + verySpecialTag)
        .end(function (err, response) {
          expect(response.statusCode).to.equal(HttpStatus.OK);
          const filteredBookmarks = response.body;
          const foundBookmark = filteredBookmarks[0];
          expect(filteredBookmarks.length).to.equal(1);
          expect(foundBookmark.name).to.equal(verySpecialTitle);
          done();
        });
    });

    it('should find bookmark with with very-special-tag in query param as word', async function () {
      const response = await request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: "very-special-tag"})
        .query({limit: 10});

      expect(response.statusCode).to.equal(HttpStatus.OK);
      const filteredBookmarks = response.body;
      const foundBookmark = filteredBookmarks[0];
      expect(filteredBookmarks.length).to.equal(1);
      expect(foundBookmark.name).to.equal(verySpecialTitle);
    });

    it('should find bookmark with with very-special-tag in query param only as tag', function (done) {
      request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: `[${verySpecialTag}]`})
        .query({limit: 10})
        .end(function (err, response) {
          expect(response.statusCode).to.equal(HttpStatus.OK);
          const filteredBookmarks = response.body;
          const foundBookmark = filteredBookmarks[0];
          expect(filteredBookmarks.length).to.equal(1);
          expect(foundBookmark.name).to.equal(verySpecialTitle);
          done();
        });
    });

    it('should find bookmark with with very-special-tag in query param as tag and word', function (done) {
      request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: `${verySpecialTag} [${verySpecialTag}]`})
        .query({limit: 10})
        .end(function (err, response) {
          expect(response.statusCode).to.equal(HttpStatus.OK);
          const filteredBookmarks = response.body;
          const foundBookmark = filteredBookmarks[0];
          expect(filteredBookmarks.length).to.equal(1);
          expect(foundBookmark.name).to.equal(verySpecialTitle);
          done();
        });
    });

    it(`should find bookmark with special title - ${verySpecialTitle} `, function (done) {
      request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: `${verySpecialTitle}`})
        .query({limit: 10})
        .end(function (err, response) {
          expect(response.statusCode).to.equal(HttpStatus.OK);
          const filteredBookmarks = response.body;
          const foundBookmark = filteredBookmarks[0];
          expect(filteredBookmarks.length).to.equal(1);
          expect(foundBookmark.name).to.equal(verySpecialTitle);
          done();
        });
    });

    it(`should find bookmark with special source code url title - ${verySpecialSourceCodeUrl} `, function (done) {
      request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: `${verySpecialSourceCodeUrl}`})
        .query({limit: 10})
        .end(function (err, response) {
          expect(response.statusCode).to.equal(HttpStatus.OK);
          const filteredBookmarks = response.body;
          const foundBookmark = filteredBookmarks[0];
          expect(filteredBookmarks.length).to.equal(1);
          expect(foundBookmark.name).to.equal(verySpecialTitle);
          done();
        });
    });

    it(`should find bookmark with special location - ${verySpecialLocation} `, function (done) {
      request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: `${verySpecialLocation}`})
        .query({limit: 10})
        .end(function (err, response) {
          expect(response.statusCode).to.equal(HttpStatus.OK);
          const filteredBookmarks = response.body;
          const foundBookmark = filteredBookmarks[0];
          expect(filteredBookmarks.length).to.equal(1);
          expect(foundBookmark.name).to.equal(verySpecialTitle);
          done();
        });
    });

  });
});
