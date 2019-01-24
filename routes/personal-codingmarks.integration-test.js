var app = require('../app');
var chai = require('chai');
var request = require('supertest');
var HttpStatus = require('http-status-codes');
var expect = chai.expect;

const common = require('../common/config');
const config = common.config();

const superagent = require('superagent');

describe('Personal Codingmarks CRUD operations', function () {

  let bearerToken;
  const testUserId = config.integration_tests.test_user_id;
  const baseApiUrlUnderTest = '/api/personal/users/';

  const codingmarkExample = {
    "name": "Cleaner code in NodeJs with async-await - Mongoose calls example – CodingpediaOrg",
    "location": "http://www.codingpedia.org/ama/cleaner-code-in-nodejs-with-async-await-mongoose-calls-example",
    "language": "en",
    "tags": [
      "nodejs",
      "async-await",
      "mongoose",
      "mongodb"
    ],
    "publishedOn": "2017-11-05",
    "githubURL": "https://github.com/Codingpedia/codingmarks-api",
    "description": "Example showing migration of Mongoose calls from previously using callbacks to using the new async-await feature in NodeJs",
    "descriptionHtml": "<p>Example showing migration of Mongoose calls from previously using callbacks to using the new async-await feature in NodeJs</p>",
    "userId": "33d22b0e-9474-46b3-9da4-b1fb5d273abc",
    "shared": true,
    "starredBy": [],
    "lastAccessedAt": null
  }

  before(function(done) {

    superagent
      .post(config.integration_tests.token_endpoint)
      .send('client_id=' + config.integration_tests.client_id)
      .send('client_secret=' + config.integration_tests.client_secret)
      .send('grant_type=client_credentials')
      .set('Accept', 'application/json')
      .then(res => {
        bearerToken = 'Bearer ' + res.body.access_token;
        done();
      });

  });

  describe('invalid user id calls' , function () {
    it('should fail trying to GET codingmarks with false user id', function (done) {
      request(app)
        .get(baseApiUrlUnderTest + 'false_user_id/codingmarks')
        .set('Authorization', bearerToken)
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.UNAUTHORIZED);
          done();
        });
    });

    it('should fail trying CREATE codingmark with invalid user id', function (done) {
      request(app)
        .post(baseApiUrlUnderTest + 'false_user_id/codingmarks')
        .set('Authorization', bearerToken)
        .send(codingmarkExample)
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.UNAUTHORIZED);
          done();
        });
    });

    it('should fail trying to UPDATE codingmark with invalid user id', function (done) {
      request(app)
        .put(baseApiUrlUnderTest + 'false_user_id/codingmarks/1324343')
        .set('Authorization', bearerToken)
        .send(codingmarkExample)
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.UNAUTHORIZED);
          done();
        });
    });

    it('should fail trying to DELETE codingmark with invalid user id', function (done) {
      request(app)
        .delete(baseApiUrlUnderTest + 'false_user_id/codingmarks/12343434')
        .set('Authorization', bearerToken)
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.UNAUTHORIZED);
          done();
        });
    });
  });

  describe('invalid codingmark attributes at CREATION' , function () {
    it('should fail trying to CREATE codingmark without a name', function (done) {
      let invalidCodingmark = JSON.parse(JSON.stringify(codingmarkExample));
      invalidCodingmark.name = '';
      request(app)
        .post(`${baseApiUrlUnderTest}${testUserId}/codingmarks`)
        .set('Authorization', bearerToken)
        .send(invalidCodingmark)
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          expect(res.body.title).to.equal('Missing required attributes');
          done();
        });
    });

    it('should fail trying to CREATE codingmark without a location', function (done) {
      let invalidCodingmark = JSON.parse(JSON.stringify(codingmarkExample));
      invalidCodingmark.location = '';
      request(app)
        .post(`${baseApiUrlUnderTest}${testUserId}/codingmarks`)
        .set('Authorization', bearerToken)
        .send(invalidCodingmark)
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          expect(res.body.title).to.equal('Missing required attributes');
          done();
        });
    });

    it('should fail trying to CREATE codingmark without tags', function (done) {
      let invalidCodingmark = JSON.parse(JSON.stringify(codingmarkExample));
      invalidCodingmark.tags = [];
      request(app)
        .post(`${baseApiUrlUnderTest}${testUserId}/codingmarks`)
        .set('Authorization', bearerToken)
        .send(invalidCodingmark)
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          expect(res.body.title).to.equal('Missing required attributes');
          done();
        });
    });

    it('should fail trying to CREATE codingmark with too many tags', function (done) {
      let invalidCodingmark = JSON.parse(JSON.stringify(codingmarkExample));
      invalidCodingmark.tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9'];
      request(app)
        .post(`${baseApiUrlUnderTest}${testUserId}/codingmarks`)
        .set('Authorization', bearerToken)
        .send(invalidCodingmark)
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          expect(res.body.title).to.equal('Too many tags have been submitted');
          done();
        });
    });

    it('should fail trying to CREATE codingmark with a too big description', function (done) {
      let invalidCodingmark = JSON.parse(JSON.stringify(codingmarkExample));
      const textSnippet = "long text in the making";
      let longText = textSnippet;
      for (var i = 0; i < 100; i++) {
        longText += textSnippet;
      }
      invalidCodingmark.description = longText;

      request(app)
        .post(`${baseApiUrlUnderTest}${testUserId}/codingmarks`)
        .set('Authorization', bearerToken)
        .send(invalidCodingmark)
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          expect(res.body.title).to.contain('The description is too long.');
          done();
        });
    });

    it('should fail trying to CREATE codingmark with a big with too many lines', function (done) {
      let invalidCodingmark = JSON.parse(JSON.stringify(codingmarkExample));
      const line = "oneline\n";
      let longText = line;
      for (var i = 0; i < 101; i++) {
        longText += line;
      }
      invalidCodingmark.description = longText;

      request(app)
        .post(`${baseApiUrlUnderTest}${testUserId}/codingmarks`)
        .set('Authorization', bearerToken)
        .send(invalidCodingmark)
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          expect(res.body.title).to.contain('The description hast too many lines.');
          done();
        });
    });

  });

});
