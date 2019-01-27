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

  const codingmarkExampleTitle = "Cleaner code in NodeJs with async-await - Mongoose calls example – CodingpediaOrg"
  const codingmarkExample = {
    "name": codingmarkExampleTitle,
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
      .then(response => {
        bearerToken = 'Bearer ' + response.body.access_token;
        done();
      });

  });

  describe('invalid user id calls' , function () {
    it('should fail trying to GET codingmarks with false user id', function (done) {
      request(app)
        .get(baseApiUrlUnderTest + 'false_user_id/codingmarks')
        .set('Authorization', bearerToken)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.UNAUTHORIZED);
          done();
        });
    });

    it('should fail trying CREATE codingmark with invalid user id', function (done) {
      request(app)
        .post(baseApiUrlUnderTest + 'false_user_id/codingmarks')
        .set('Authorization', bearerToken)
        .send(codingmarkExample)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.UNAUTHORIZED);
          done();
        });
    });

    it('should fail trying to UPDATE codingmark with invalid user id', function (done) {
      request(app)
        .put(baseApiUrlUnderTest + 'false_user_id/codingmarks/1324343')
        .set('Authorization', bearerToken)
        .send(codingmarkExample)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.UNAUTHORIZED);
          done();
        });
    });

    it('should fail trying to DELETE codingmark with invalid user id', function (done) {
      request(app)
        .delete(baseApiUrlUnderTest + 'false_user_id/codingmarks/12343434')
        .set('Authorization', bearerToken)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.UNAUTHORIZED);
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
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          expect(response.body.title).to.equal('Missing required attributes');
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
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          expect(response.body.title).to.equal('Missing required attributes');
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
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          expect(response.body.title).to.equal('Missing required attributes');
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
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          expect(response.body.title).to.equal('Too many tags have been submitted');
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
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          expect(response.body.title).to.contain('The description is too long.');
          done();
        });
    });

    it('should fail trying to CREATE codingmark with a description with too many lines', function (done) {
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
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          expect(response.body.title).to.contain('The description hast too many lines.');
          done();
        });
    });

  });

  describe('inexistent codingmark id tests' , function () {
    it('should fail trying to update inexistent codingmark', function (done) {
      let inexistentCodingmarkId = '507f1f77bcf86cd799439011';
      request(app)
        .put(`${baseApiUrlUnderTest}${testUserId}/codingmarks/${inexistentCodingmarkId}`)
        .set('Authorization', bearerToken)
        .send(codingmarkExample)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.NOT_FOUND);
          expect(response.body.title).to.equal('Not Found Error');
          done();
        });
    });
    it('should fail trying to delete inexistent codingmark', function (done) {
      let inexistentCodingmarkId = '507f1f77bcf86cd799439011';
      request(app)
        .delete(`${baseApiUrlUnderTest}${testUserId}/codingmarks/${inexistentCodingmarkId}`)
        .set('Authorization', bearerToken)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.NOT_FOUND);
          expect(response.body.title).to.equal('Not Found Error');
          done();
        });
    });

  });

  describe('test successful creation, update and deletion of codingmark' , function () {

    let createdCodingmark;

    it('should succeed creating example codingmark', function (done) {
      request(app)
        .post(`${baseApiUrlUnderTest}${testUserId}/codingmarks`)
        .set('Authorization', bearerToken)
        .send(codingmarkExample)
        .end(function (error, response) {
          if (error) {
            return done(error);
          }
          expect(response.statusCode).to.equal(HttpStatus.CREATED);
          const locationHeaderValue = response.header['location']
          const isLocationHeaderPresent = response.header['location'] !== undefined;
          expect(isLocationHeaderPresent).to.be.true;

          //set the id of the codingmarkexample now that it is created
          const lastSlashIndex = locationHeaderValue.lastIndexOf('/');
          const codingmarkId = locationHeaderValue.substring(lastSlashIndex + 1);

          request(app)
            .get(`${baseApiUrlUnderTest}${testUserId}/codingmarks/${codingmarkId}`)
            .set('Authorization', bearerToken)
            .end(function (error, response) {
              if (error) {
                return done(error);
              }
              expect(response.statusCode).to.equal(HttpStatus.OK);
              createdCodingmark = response.body;
              console.log(createdCodingmark);
              expect(createdCodingmark._id).to.equal(codingmarkId);
              expect(createdCodingmark.name).to.equal(codingmarkExample.name);
              expect(createdCodingmark.location).to.equal(codingmarkExample.location);

              done();
            });
        });
    });

    it('should fail trying to add codingmark with existent location for same user', function (done) {
      request(app)
        .post(`${baseApiUrlUnderTest}${testUserId}/codingmarks`)
        .set('Authorization', bearerToken)
        .send(codingmarkExample)
        .end(function (error, response) {
          if (error) {
            return done(error);
          }
          expect(response.statusCode).to.equal(HttpStatus.CONFLICT);
          expect(response.body.title).to.equal('Duplicate key');
          done();
        });
    });

    describe('invalid codingmark attributes at UPDATE' , function () {
      it('should fail trying to UPDATE codingmark without a title', function (done) {
        let invalidCodingmark = JSON.parse(JSON.stringify(createdCodingmark));
        invalidCodingmark.name = '';
        request(app)
          .put(`${baseApiUrlUnderTest}${testUserId}/codingmarks/${createdCodingmark._id}`)
          .set('Authorization', bearerToken)
          .send(invalidCodingmark)
          .end(function (error, response) {
            expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
            expect(response.body.title).to.equal('Missing required attributes');
            done();
          });
      });

      it('should fail trying to UPDATE codingmark without a location', function (done) {
        let invalidCodingmark = JSON.parse(JSON.stringify(createdCodingmark));
        invalidCodingmark.location = '';
        request(app)
          .put(`${baseApiUrlUnderTest}${testUserId}/codingmarks/${createdCodingmark._id}`)
          .set('Authorization', bearerToken)
          .send(invalidCodingmark)
          .end(function (error, response) {
            expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
            expect(response.body.title).to.equal('Missing required attributes');
            done();
          });
      });

      it('should fail trying to UPDATE codingmark without tags', function (done) {
        let invalidCodingmark = JSON.parse(JSON.stringify(createdCodingmark));
        invalidCodingmark.tags = [];
        request(app)
          .put(`${baseApiUrlUnderTest}${testUserId}/codingmarks/${createdCodingmark._id}`)
          .set('Authorization', bearerToken)
          .send(invalidCodingmark)
          .end(function (error, response) {
            expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
            expect(response.body.title).to.equal('Missing required attributes');
            done();
          });
      });

      it('should fail trying to UPDATE codingmark with too many tags', function (done) {
        let invalidCodingmark = JSON.parse(JSON.stringify(createdCodingmark));
        invalidCodingmark.tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9'];
        request(app)
          .put(`${baseApiUrlUnderTest}${testUserId}/codingmarks/${createdCodingmark._id}`)
          .set('Authorization', bearerToken)
          .send(invalidCodingmark)
          .end(function (error, response) {
            expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
            expect(response.body.title).to.equal('Too many tags have been submitted');
            done();
          });
      });

      it('should fail trying to UPDATE codingmark with a too big description', function (done) {
        let invalidCodingmark = JSON.parse(JSON.stringify(createdCodingmark));
        const textSnippet = "long text in the making";
        let longText = textSnippet;
        for (var i = 0; i < 100; i++) {
          longText += textSnippet;
        }
        invalidCodingmark.description = longText;

        request(app)
          .put(`${baseApiUrlUnderTest}${testUserId}/codingmarks/${createdCodingmark._id}`)
          .set('Authorization', bearerToken)
          .send(invalidCodingmark)
          .end(function (error, response) {
            expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
            expect(response.body.title).to.contain('The description is too long.');
            done();
          });
      });

      it('should fail trying to UPDATE codingmark with a description with too many lines', function (done) {
        let invalidCodingmark = JSON.parse(JSON.stringify(createdCodingmark));
        const line = "oneline\n";
        let longText = line;
        for (var i = 0; i < 101; i++) {
          longText += line;
        }
        invalidCodingmark.description = longText;

        request(app)
          .put(`${baseApiUrlUnderTest}${testUserId}/codingmarks/${createdCodingmark._id}`)
          .set('Authorization', bearerToken)
          .send(invalidCodingmark)
          .end(function (error, response) {
            expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
            expect(response.body.title).to.contain('The description hast too many lines.');
            done();
          });
      });

    });

    it('should successfully UPDATE codingmark', function (done) {
      let updatedCodingmark= JSON.parse(JSON.stringify(createdCodingmark));
      updatedCodingmark.name += ' rocks';

      request(app)
        .put(`${baseApiUrlUnderTest}${testUserId}/codingmarks/${updatedCodingmark._id}`)
        .set('Authorization', bearerToken)
        .send(updatedCodingmark)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.OK);
          expect(response.body.name).to.equal(codingmarkExampleTitle + ' rocks');

          //make also a read to be sure sure :P
          request(app)
            .get(`${baseApiUrlUnderTest}${testUserId}/codingmarks/${updatedCodingmark._id}`)
            .set('Authorization', bearerToken)
            .end(function (error, response) {
              if (error) {
                return done(error);
              }
              expect(response.statusCode).to.equal(HttpStatus.OK);
              expect(response.body.name).to.equal(codingmarkExampleTitle + ' rocks');

              done();
            });
        });
    });

    it('should succeed deleting created codingmark', function (done) {
      request(app)
        .delete(`${baseApiUrlUnderTest}${testUserId}/codingmarks/${createdCodingmark._id}`)
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
