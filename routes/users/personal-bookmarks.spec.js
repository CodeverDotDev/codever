const app = require('../../app');
const chai = require('chai');
const request = require('supertest');
const HttpStatus = require('http-status-codes');
const expect = chai.expect;

const Bookmark = require('../../models/bookmark');

const common = require('../../common/config');
const config = common.config();

const superagent = require('superagent');

const testData = require('../../common/test-data');

describe('Personal Bookmarks tests', function () {

  let bearerToken;
  const testUserId = config.integration_tests.test_user_id;
  const baseApiUrlUnderTest = '/api/personal/users/';

  let bookmarkExample = testData.bookmarkExample;

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
    it('should fail trying to GET bookmarks with false user id', function (done) {
      request(app)
        .get(baseApiUrlUnderTest + 'false_user_id/bookmarks')
        .set('Authorization', bearerToken)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.UNAUTHORIZED);
          done();
        });
    });

    it('should fail trying CREATE bookmark with invalid user id', function (done) {
      request(app)
        .post(baseApiUrlUnderTest + 'false_user_id/bookmarks')
        .set('Authorization', bearerToken)
        .send(bookmarkExample)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.UNAUTHORIZED);
          done();
        });
    });

    it('should fail trying to UPDATE bookmark with invalid user id', function (done) {
      request(app)
        .put(baseApiUrlUnderTest + 'false_user_id/bookmarks/1324343')
        .set('Authorization', bearerToken)
        .send(bookmarkExample)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.UNAUTHORIZED);
          done();
        });
    });

    it('should fail trying to DELETE bookmark with invalid user id', function (done) {
      request(app)
        .delete(baseApiUrlUnderTest + 'false_user_id/bookmarks/12343434')
        .set('Authorization', bearerToken)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.UNAUTHORIZED);
          done();
        });
    });
  });

  describe('invalid bookmark attributes at CREATION' , function () {
    it('should fail trying to CREATE bookmark without a name', function (done) {
      let invalidBookmark = JSON.parse(JSON.stringify(bookmarkExample));
      invalidBookmark.name = '';
      request(app)
        .post(`${baseApiUrlUnderTest}${testUserId}/bookmarks`)
        .set('Authorization', bearerToken)
        .send(invalidBookmark)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          expect(response.body.title).to.equal('Missing required attributes');
          done();
        });
    });

    it('should fail trying to CREATE bookmark without a location', function (done) {
      let invalidBookmark = JSON.parse(JSON.stringify(bookmarkExample));
      invalidBookmark.location = '';
      request(app)
        .post(`${baseApiUrlUnderTest}${testUserId}/bookmarks`)
        .set('Authorization', bearerToken)
        .send(invalidBookmark)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          expect(response.body.title).to.equal('Missing required attributes');
          done();
        });
    });

    it('should fail trying to CREATE bookmark without tags', function (done) {
      let invalidBookmark = JSON.parse(JSON.stringify(bookmarkExample));
      invalidBookmark.tags = [];
      request(app)
        .post(`${baseApiUrlUnderTest}${testUserId}/bookmarks`)
        .set('Authorization', bearerToken)
        .send(invalidBookmark)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          expect(response.body.title).to.equal('Missing required attributes');
          done();
        });
    });

    it('should fail trying to CREATE bookmark with too many tags', function (done) {
      let invalidBookmark = JSON.parse(JSON.stringify(bookmarkExample));
      invalidBookmark.tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9'];
      request(app)
        .post(`${baseApiUrlUnderTest}${testUserId}/bookmarks`)
        .set('Authorization', bearerToken)
        .send(invalidBookmark)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          expect(response.body.title).to.equal('Too many tags have been submitted');
          done();
        });
    });

    it('should fail trying to CREATE bookmark with a too big description', function (done) {
      let invalidBookmark = JSON.parse(JSON.stringify(bookmarkExample));
      const textSnippet = "long text in the making";
      let longText = textSnippet;
      for (var i = 0; i < 100; i++) {
        longText += textSnippet;
      }
      invalidBookmark.description = longText;

      request(app)
        .post(`${baseApiUrlUnderTest}${testUserId}/bookmarks`)
        .set('Authorization', bearerToken)
        .send(invalidBookmark)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          expect(response.body.title).to.contain('The description is too long.');
          done();
        });
    });

    it('should fail trying to CREATE bookmark with a description with too many lines', function (done) {
      let invalidBookmark = JSON.parse(JSON.stringify(bookmarkExample));
      const line = "oneline\n";
      let longText = line;
      for (var i = 0; i < 101; i++) {
        longText += line;
      }
      invalidBookmark.description = longText;

      request(app)
        .post(`${baseApiUrlUnderTest}${testUserId}/bookmarks`)
        .set('Authorization', bearerToken)
        .send(invalidBookmark)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          expect(response.body.title).to.contain('The description hast too many lines.');
          done();
        });
    });

  });

  describe('inexistent bookmark id tests' , function () {
    it('should fail trying to update inexistent bookmark', function (done) {
      let inexistentBookmarkId = '507f1f77bcf86cd799439011';
      request(app)
        .put(`${baseApiUrlUnderTest}${testUserId}/bookmarks/${inexistentBookmarkId}`)
        .set('Authorization', bearerToken)
        .send(bookmarkExample)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.NOT_FOUND);
          expect(response.body.title).to.equal('Not Found Error');
          done();
        });
    });
    it('should fail trying to delete inexistent bookmark', function (done) {
      let inexistentBookmarkId = '507f1f77bcf86cd799439011';
      request(app)
        .delete(`${baseApiUrlUnderTest}${testUserId}/bookmarks/${inexistentBookmarkId}`)
        .set('Authorization', bearerToken)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.NOT_FOUND);
          expect(response.body.title).to.equal('Not Found Error');
          done();
        });
    });

  });

  describe('test successful creation, update and deletion of bookmark' , function () {

    let createdBookmark;

    it('should succeed creating example bookmark', function (done) {
      request(app)
        .post(`${baseApiUrlUnderTest}${testUserId}/bookmarks`)
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
          const bookmarkId = locationHeaderValue.substring(lastSlashIndex + 1);

          request(app)
            .get(`${baseApiUrlUnderTest}${testUserId}/bookmarks/${bookmarkId}`)
            .set('Authorization', bearerToken)
            .end(function (error, response) {
              if (error) {
                return done(error);
              }
              expect(response.statusCode).to.equal(HttpStatus.OK);
              createdBookmark = response.body;
              console.log(createdBookmark);
              expect(createdBookmark._id).to.equal(bookmarkId);
              expect(createdBookmark.name).to.equal(bookmarkExample.name);
              expect(createdBookmark.location).to.equal(bookmarkExample.location);

              done();
            });
        });
    });

    it('should fail trying to add bookmark with existent location for same user', function (done) {
      request(app)
        .post(`${baseApiUrlUnderTest}${testUserId}/bookmarks`)
        .set('Authorization', bearerToken)
        .send(bookmarkExample)
        .end(function (error, response) {
          if (error) {
            return done(error);
          }
          expect(response.statusCode).to.equal(HttpStatus.CONFLICT);
          expect(response.body.title).to.equal('A public bookmark with this location is already present');
          done();
        });
    });

    describe('invalid bookmark attributes at UPDATE' , function () {
      it('should fail trying to UPDATE bookmark without a title', function (done) {
        let invalidBookmark = JSON.parse(JSON.stringify(createdBookmark));
        invalidBookmark.name = '';
        request(app)
          .put(`${baseApiUrlUnderTest}${testUserId}/bookmarks/${createdBookmark._id}`)
          .set('Authorization', bearerToken)
          .send(invalidBookmark)
          .end(function (error, response) {
            expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
            expect(response.body.title).to.equal('Missing required attributes');
            done();
          });
      });

      it('should fail trying to UPDATE bookmark without a location', function (done) {
        let invalidBookmark = JSON.parse(JSON.stringify(createdBookmark));
        invalidBookmark.location = '';
        request(app)
          .put(`${baseApiUrlUnderTest}${testUserId}/bookmarks/${createdBookmark._id}`)
          .set('Authorization', bearerToken)
          .send(invalidBookmark)
          .end(function (error, response) {
            expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
            expect(response.body.title).to.equal('Missing required attributes');
            done();
          });
      });

      it('should fail trying to UPDATE bookmark without tags', function (done) {
        let invalidBookmark = JSON.parse(JSON.stringify(createdBookmark));
        invalidBookmark.tags = [];
        request(app)
          .put(`${baseApiUrlUnderTest}${testUserId}/bookmarks/${createdBookmark._id}`)
          .set('Authorization', bearerToken)
          .send(invalidBookmark)
          .end(function (error, response) {
            expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
            expect(response.body.title).to.equal('Missing required attributes');
            done();
          });
      });

      it('should fail trying to UPDATE bookmark with too many tags', function (done) {
        let invalidBookmark = JSON.parse(JSON.stringify(createdBookmark));
        invalidBookmark.tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9'];
        request(app)
          .put(`${baseApiUrlUnderTest}${testUserId}/bookmarks/${createdBookmark._id}`)
          .set('Authorization', bearerToken)
          .send(invalidBookmark)
          .end(function (error, response) {
            expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
            expect(response.body.title).to.equal('Too many tags have been submitted');
            done();
          });
      });

      it('should fail trying to UPDATE bookmark with a too big description', function (done) {
        let invalidBookmark = JSON.parse(JSON.stringify(createdBookmark));
        const textSnippet = "long text in the making";
        let longText = textSnippet;
        for (var i = 0; i < 100; i++) {
          longText += textSnippet;
        }
        invalidBookmark.description = longText;

        request(app)
          .put(`${baseApiUrlUnderTest}${testUserId}/bookmarks/${createdBookmark._id}`)
          .set('Authorization', bearerToken)
          .send(invalidBookmark)
          .end(function (error, response) {
            expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
            expect(response.body.title).to.contain('The description is too long.');
            done();
          });
      });

      it('should fail trying to UPDATE bookmark with a description with too many lines', function (done) {
        let invalidBookmark = JSON.parse(JSON.stringify(createdBookmark));
        const line = "oneline\n";
        let longText = line;
        for (var i = 0; i < 101; i++) {
          longText += line;
        }
        invalidBookmark.description = longText;

        request(app)
          .put(`${baseApiUrlUnderTest}${testUserId}/bookmarks/${createdBookmark._id}`)
          .set('Authorization', bearerToken)
          .send(invalidBookmark)
          .end(function (error, response) {
            expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
            expect(response.body.title).to.contain('The description hast too many lines.');
            done();
          });
      });

    });

    it('should successfully UPDATE bookmark', function (done) {
      let updatedBookmark= JSON.parse(JSON.stringify(createdBookmark));
      updatedBookmark.name += ' rocks';

      request(app)
        .put(`${baseApiUrlUnderTest}${testUserId}/bookmarks/${updatedBookmark._id}`)
        .set('Authorization', bearerToken)
        .send(updatedBookmark)
        .end(function (error, response) {
          expect(response.statusCode).to.equal(HttpStatus.OK);
          expect(response.body.name).to.equal(bookmarkExample.name + ' rocks');

          //make also a read to be sure sure :P
          request(app)
            .get(`${baseApiUrlUnderTest}${testUserId}/bookmarks/${updatedBookmark._id}`)
            .set('Authorization', bearerToken)
            .end(function (error, response) {
              if (error) {
                return done(error);
              }
              expect(response.statusCode).to.equal(HttpStatus.OK);
              expect(response.body.name).to.equal(bookmarkExample.name  + ' rocks');

              done();
            });
        });
    });

    it('should succeed deleting created bookmark', function (done) {
      request(app)
        .delete(`${baseApiUrlUnderTest}${testUserId}/bookmarks/${createdBookmark._id}`)
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

  describe('Personal bookmarks - test search functionality', function () {

    const testUserId = config.integration_tests.test_user_id;
    const baseApiUnderTestUrl = '/api/personal/users/' + testUserId + '/bookmarks/';

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
      "stars": 0,
      "lastAccessedAt": null
    }

    it('should succeed creating example bookmark', function (done) {
      request(app)
        .post(baseApiUnderTestUrl)
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

    it('should find bookmark with with very-special-tag in query param as word', function (done) {
      request(app)
        .get(baseApiUnderTestUrl)
        .set('Authorization', bearerToken)
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

    it('should find bookmark with with very-special-tag in query param only as tag', function (done) {
      request(app)
        .get(baseApiUnderTestUrl)
        .set('Authorization', bearerToken)
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
        .set('Authorization', bearerToken)
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
        .set('Authorization', bearerToken)
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
        .set('Authorization', bearerToken)
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
        .set('Authorization', bearerToken)
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
        .delete(`${baseApiUnderTestUrl}/${createdBookmarkId}`)
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
