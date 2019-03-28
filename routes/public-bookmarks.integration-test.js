const app = require('../app');
const chai = require('chai');
const request = require('supertest');
const HttpStatus = require('http-status-codes');
const expect = chai.expect;

const common = require('../common/config');
const config = common.config();

const superagent = require('superagent');

describe('Public API Tests', function () {

  describe('get latest bookmarks function tests', function () {
    const latestEntriesApiBaseUrl = '/api/public/bookmarks/latest-entries';

    it('should return the latest bookmarks - without query parameters', function (done) {
      request(app)
        .get(latestEntriesApiBaseUrl)
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.OK);
          done();
        });
    });

    it('should return the latest bookmarks - "since" parameter', function (done) {
      let oneMonthBeforeNow = new Date();
      oneMonthBeforeNow.setMonth(oneMonthBeforeNow.getMonth() - 1);
      request(app)
        .get(latestEntriesApiBaseUrl)
        .query({since: oneMonthBeforeNow.getTime()})
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.OK);
          done();
        });
    });

    it('should return the latest bookmarks - "since" and "to" parameter', function (done) {
      let sevenDaysBeforeNow = new Date();
      sevenDaysBeforeNow.setDate(sevenDaysBeforeNow.getDate() - 7);

      let twoDaysBeforeNow = new Date();
      twoDaysBeforeNow.setDate(twoDaysBeforeNow.getDate() - 7);

      request(app)
        .get(latestEntriesApiBaseUrl)
        .query({since: sevenDaysBeforeNow.getTime()})
        .query({to: twoDaysBeforeNow.getTime()})
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.OK);
          done();
        });
    });

    it('should return bad request - invalid "since" and "to" parameter', function (done) {
      let sevenDaysBeforeNow = new Date();
      sevenDaysBeforeNow.setDate(sevenDaysBeforeNow.getDate() - 7);

      let twoDaysBeforeNow = new Date();
      twoDaysBeforeNow.setDate(twoDaysBeforeNow.getDate() - 2);

      request(app)
        .get(latestEntriesApiBaseUrl)
        .query({since: twoDaysBeforeNow.getTime()})
        .query({to: sevenDaysBeforeNow.getTime()})
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          done();
        });
    });
  });

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
    const testUserId = config.integration_tests.test_user_id;
    const basePersonalApiUrl = '/api/personal/users/';
    const baseApiUnderTestUrl = '/api/public/bookmarks/';

    let createdBookmarkId;

    const verySpecialTitle = "very special title very-special-java-title";
    const verySpecialLocation = "http://www.very-special-url.com";
    const verySpecialTag = "very-special-tag";
    const verySpecialSourceCodeUrl = "https://very-special-github-url.com";
    const bookmarkExample = {
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
      "lastAccessedAt": null
    }


    before(function (done) {
      superagent
        .post(config.integration_tests.token_endpoint)
        .send('client_id=' + config.integration_tests.client_id)
        .send('client_secret=' + config.integration_tests.client_secret)
        .send('grant_type=client_credentials')
        .set('Accept', 'application/json')
        .then(response => {
          bearerToken = 'Bearer ' + response.body.access_token;
          done();
        });
    });

    it('should succeed creating example bookmark', function (done) {
      request(app)
        .post(`${basePersonalApiUrl}${testUserId}/bookmarks`)
        .set('Authorization', bearerToken)
        .send(bookmarkExample)
        .end(function (error, response) {
          if (error) {
            return done(error);
          }
          expect(response.statusCode).to.equal(HttpStatus.CREATED);
          const locationHeaderValue = response.header['location']
          const isLocationHeaderPresent = response.header['location'] !== undefined;
          expect(isLocationHeaderPresent).to.be.true;

          //set the id of the bookmarkexample now that it is created
          const lastSlashIndex = locationHeaderValue.lastIndexOf('/');
          createdBookmarkId = locationHeaderValue.substring(lastSlashIndex + 1);

          done();
        });
    });

    it('should find bookmark by location query param', function (done) {
      request(app)
        .get(baseApiUnderTestUrl)
        .query({location: verySpecialLocation})
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.OK);
          done();
        });
    });

    it('should find bookmark tagged with very-special-tag', function (done) {
      request(app)
        .get(baseApiUnderTestUrl + 'tagged/' + verySpecialTag)
        .end(function (err, response) {
          expect(response.statusCode).to.equal(HttpStatus.OK);
          const filteredBookmarks = response.body;
          const foundBookmark = filteredBookmarks[0];
          expect(filteredBookmarks.length).to.equal(1);
          expect(foundBookmark.name).to.equal(verySpecialTitle);
          done();
        });
    });

    it('should find bookmark with with very-special-tag in query param as word', function (done) {
      request(app)
        .get(baseApiUnderTestUrl)
        .query({query: "very-special-tag"})
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

    it('should find bookmark with with very-special-tag in query param as tag', function (done) {
      request(app)
        .get(baseApiUnderTestUrl)
        .query({query: `[${verySpecialTag}]`})
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
        .get(baseApiUnderTestUrl)
        .query({query: `${verySpecialTag} [${verySpecialTag}]`})
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
        .get(baseApiUnderTestUrl)
        .query({query: `${verySpecialTitle}`})
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
        .get(baseApiUnderTestUrl)
        .query({query: `${verySpecialSourceCodeUrl}`})
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
        .get(baseApiUnderTestUrl)
        .query({query: `${verySpecialLocation}`})
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

    it('should succeed deleting created bookmark', function (done) {
      request(app)
        .delete(`${basePersonalApiUrl}${testUserId}/bookmarks/${createdBookmarkId}`)
        .set('Authorization', bearerToken)
        .end(function (error, response) {
          if (error) {
            return done(error);
          }
          expect(response.statusCode).to.equal(HttpStatus.NO_CONTENT);

          done();
        });
    });

  });
});
