const app = require('../../app');
const chai = require('chai');
const request = require('supertest');
const HttpStatus = require('http-status-codes');
const expect = chai.expect;

const common = require('../../common/config');
const config = common.config();

const superagent = require('superagent');

describe('Admin API Tests', function () {

  let bearerToken;
  const adminClientId = config.integration_tests.admin.client_id;
  const baseApiUnderTestUrl = '/api/admin/bookmarks/';

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
    "userId": adminClientId,
    "shared": true,
    "starredBy": [],
    "lastAccessedAt": null
  }


  before(function (done) {
    superagent
      .post(config.integration_tests.token_endpoint)
      .send('client_id=' + config.integration_tests.admin.client_id)
      .send('client_secret=' + config.integration_tests.admin.client_secret)
      .send('grant_type=client_credentials')
      .set('Accept', 'application/json')
      .then(response => {
        bearerToken = 'Bearer ' + response.body.access_token;
        console.log(bearerToken);
        done();
      });
  });

  describe('Get bookmarks functionality', function () {

    it('should find some bookmarks', function (done) {
      request(app)
        .get(baseApiUnderTestUrl)
        .set('Authorization', bearerToken)
        .end(function (err, response) {
          expect(response.statusCode).to.equal(HttpStatus.OK);
          const bookmarks = response.body;
          expect(bookmarks.length).to.be.above(1);

          done();
        });
    });


    it('should find some public bookmarks', function (done) {
      request(app)
        .get(baseApiUnderTestUrl)
        .set('Authorization', bearerToken)
        .query({public: true}) //difference to previous test
        .end(function (err, response) {
          expect(response.statusCode).to.equal(HttpStatus.OK);
          const bookmarks = response.body;
          expect(bookmarks.length).to.be.above(1);

          done();
        });
    });

  });
});
