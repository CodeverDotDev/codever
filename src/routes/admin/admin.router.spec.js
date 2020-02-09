const app = require('../../app');
const chai = require('chai');
const request = require('supertest');
const HttpStatus = require('http-status-codes/index');
const expect = chai.expect;


const common = require('../../common/config');
const config = common.config();
const constants = require('../../common/constants');

const superagent = require('superagent');

describe('Admin API Tests', function () {

  let adminBearerToken;
  const baseApiUnderTestUrl = '/api/admin/bookmarks/';

  let bookmarkExample;
  const bookmarkExampleLocation = "http://www.codepedia.org/ama/admin-api-tests";

  before(async function () {

    //set admin bearer token
    const response = await superagent
      .post(config.integration_tests.token_endpoint)
      .send('client_id=' + config.integration_tests.admin.client_id)
      .send('client_secret=' + config.integration_tests.admin.client_secret)
      .send('grant_type=client_credentials')
      .set('Accept', 'application/json');

    adminBearerToken = 'Bearer ' + response.body.access_token;

    //set bookmark example
    bookmarkExample = {
      "name": "Cleaner code in NodeJs with async-await - Mongoose calls example – CodingpediaOrg",
      "location": bookmarkExampleLocation,
      "language": "en",
      "tags": [
        "nodejs",
        "async-await",
        "mongoose",
        "mongodb"
      ],
      "publishedOn": "2017-11-05",
      "githubURL": "https://github.com/Codingpedia/bookmarks.dev-api",
      "description": "Example showing migration of Mongoose calls from previously using callbacks to using the new async-await feature in NodeJs",
      "descriptionHtml": "<p>Example showing migration of Mongoose calls from previously using callbacks to using the new async-await feature in NodeJs</p>",
      "userId": "some-user-id-for-admin-api-tests",
      "shared": true,
      "likes": 0,
      "lastAccessedAt": null
    }
  });

  describe('Get bookmarks functionality', function () {

    it('should find some bookmarks', async function () {
      const response = await request(app)
        .get(baseApiUnderTestUrl)
        .set('Authorization', adminBearerToken);

      expect(response.statusCode).to.equal(HttpStatus.OK);
      const bookmarks = response.body;
      expect(bookmarks.length).to.be.above(1);
    });


    it('should find some public bookmarks', async function () {
      const response = await request(app)
        .get(baseApiUnderTestUrl)
        .set('Authorization', adminBearerToken)
        .query({public: true}); //difference to previous test

      expect(response.statusCode).to.equal(HttpStatus.OK);
      const bookmarks = response.body;
      expect(bookmarks.length).to.be.above(1);

    });

  });

  describe('get latest bookmarks function tests', function () {
    const latestEntriesApiBaseUrl = baseApiUnderTestUrl + 'latest-entries';

    it('should return the latest bookmarks - without query parameters', async function () {
      const response = await request(app)
        .get(latestEntriesApiBaseUrl)
        .set('Authorization', adminBearerToken);

      expect(response.statusCode).to.equal(HttpStatus.OK);
    });

    it('should return the latest bookmarks - "since" parameter', async function () {
      let oneMonthBeforeNow = new Date();
      oneMonthBeforeNow.setMonth(oneMonthBeforeNow.getMonth() - 1);

      const response = await request(app)
        .get(latestEntriesApiBaseUrl)
        .query({since: oneMonthBeforeNow.getTime()})
        .set('Authorization', adminBearerToken);

      expect(response.statusCode).to.equal(HttpStatus.OK);
    });

    it('should return the latest bookmarks - "since" and "to" parameter', async function () {
      let sevenDaysBeforeNow = new Date();
      sevenDaysBeforeNow.setDate(sevenDaysBeforeNow.getDate() - 7);

      let twoDaysBeforeNow = new Date();
      twoDaysBeforeNow.setDate(twoDaysBeforeNow.getDate() - 7);

      const response = await request(app)
        .get(latestEntriesApiBaseUrl)
        .query({since: sevenDaysBeforeNow.getTime()})
        .query({to: twoDaysBeforeNow.getTime()})
        .set('Authorization', adminBearerToken);

      expect(response.statusCode).to.equal(HttpStatus.OK);
    });

    it('should return bad request - invalid "since" and "to" parameter', async function () {
      let sevenDaysBeforeNow = new Date();
      sevenDaysBeforeNow.setDate(sevenDaysBeforeNow.getDate() - 7);

      let twoDaysBeforeNow = new Date();
      twoDaysBeforeNow.setDate(twoDaysBeforeNow.getDate() - 2);

      const response = await request(app)
        .get(latestEntriesApiBaseUrl)
        .query({since: twoDaysBeforeNow.getTime()})
        .query({to: sevenDaysBeforeNow.getTime()})
        .set('Authorization', adminBearerToken);

      expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
    });
  });

  describe('invalid bookmark attributes at CREATION', function () {

    it('should fail trying to CREATE bookmark without a name', async function () {
      let bookmarkWithoutName = JSON.parse(JSON.stringify(bookmarkExample));
      bookmarkWithoutName.name = '';

      const response = await request(app)
        .post(`${baseApiUnderTestUrl}`)
        .set('Authorization', adminBearerToken)
        .send(bookmarkWithoutName);

      expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
      expect(response.body.message).to.equal('The bookmark you submitted is not valid');
      expect(response.body.validationErrors).to.include('Missing required attribute - name');
    });

    it('should fail trying to CREATE bookmark without a userId', async function () {
      let bookmarkdWithoutUserId = JSON.parse(JSON.stringify(bookmarkExample));
      bookmarkdWithoutUserId.userId = '';

      const response = await request(app)
        .post(`${baseApiUnderTestUrl}`)
        .set('Authorization', adminBearerToken)
        .send(bookmarkdWithoutUserId);

      expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
      expect(response.body.message).to.equal('The bookmark you submitted is not valid');
      expect(response.body.validationErrors).to.include('Missing required attribute - userId');
    });

    it('should fail trying to CREATE bookmark without a location', async function () {
      let bookmarkWithoutLocation = JSON.parse(JSON.stringify(bookmarkExample));
      bookmarkWithoutLocation.location = '';

      const response = await request(app)
        .post(`${baseApiUnderTestUrl}`)
        .set('Authorization', adminBearerToken)
        .send(bookmarkWithoutLocation);

      expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
      expect(response.body.message).to.equal('The bookmark you submitted is not valid');
      expect(response.body.validationErrors).to.include('Missing required attribute - location');
    });

    it('should fail trying to CREATE bookmark without tags', async function () {
      let bookmarkWithoutTags = JSON.parse(JSON.stringify(bookmarkExample));
      bookmarkWithoutTags.tags = [];

      const response = await request(app)
        .post(`${baseApiUnderTestUrl}`)
        .set('Authorization', adminBearerToken)
        .send(bookmarkWithoutTags);

      expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
      expect(response.body.message).to.equal('The bookmark you submitted is not valid');
      expect(response.body.validationErrors).to.include('Missing required attribute - tags');
    });

    it('should fail trying to CREATE bookmark with too many tags', async function () {
      let bookmark_with_too_many_tags = JSON.parse(JSON.stringify(bookmarkExample));
      bookmark_with_too_many_tags.tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9'];

      const response = await request(app)
        .post(`${baseApiUnderTestUrl}`)
        .set('Authorization', adminBearerToken)
        .send(bookmark_with_too_many_tags);

      expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
      expect(response.body.message).to.equal('The bookmark you submitted is not valid');
      expect(response.body.validationErrors).to.include('Too many tags have been submitted - max allowed 8');
    });

    it('should fail trying to CREATE bookmark with a too big description', async function () {
      let bookmark_with_a_too_big_description = JSON.parse(JSON.stringify(bookmarkExample));
      const textSnippet = "long text in the making";
      let longText = textSnippet;
      for (var i = 0; i < 100; i++) {
        longText += textSnippet;
      }
      bookmark_with_a_too_big_description.description = longText;

      const response = await request(app)
        .post(`${baseApiUnderTestUrl}`)
        .set('Authorization', adminBearerToken)
        .send(bookmark_with_a_too_big_description);

      expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
      expect(response.body.message).to.equal('The bookmark you submitted is not valid');
      expect(response.body.validationErrors).to.include('The description is too long. Only ' + constants.MAX_NUMBER_OF_CHARS_FOR_DESCRIPTION + ' allowed');
    });

    it('should fail trying to CREATE bookmark with a description with too many lines', async function () {
      let bookmark_with_description_with_too_many_lines = JSON.parse(JSON.stringify(bookmarkExample));
      const line = "oneline\n";
      let longText = line;
      for (var i = 0; i < 101; i++) {
        longText += line;
      }
      bookmark_with_description_with_too_many_lines.description = longText;

      const response = await request(app)
        .post(`${baseApiUnderTestUrl}`)
        .set('Authorization', adminBearerToken)
        .send(bookmark_with_description_with_too_many_lines);

      expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
      expect(response.body.validationErrors).to.include('The description hast too many lines. Only ' + constants.MAX_NUMBER_OF_LINES_FOR_DESCRIPTION + ' allowed');
    });

  });

  describe('admin - test successful creation, update and deletion of bookmark', function () {

    let createdBookmark;

    before(async function () {
      //proactively try deletion of bookmark
      await request(app)
        .delete(baseApiUnderTestUrl)
        .query({'location': bookmarkExampleLocation})
        .set('Authorization', adminBearerToken)
    });


    it('should succeed creating example bookmark', async function () {

      const response = await request(app)
        .post(baseApiUnderTestUrl)
        .set('Authorization', adminBearerToken)
        .send(bookmarkExample);

      expect(response.statusCode).to.equal(HttpStatus.CREATED);
      const locationHeaderValue = response.header['location']
      const isLocationHeaderPresent = response.header['location'] !== undefined;
      expect(isLocationHeaderPresent).to.be.true;

      //set the id of the bookmarkexample now that it is created
      const lastSlashIndex = locationHeaderValue.lastIndexOf('/');
      const bookmarkId = locationHeaderValue.substring(lastSlashIndex + 1);

      const createdBookmarkResponse = await request(app)
        .get(`${baseApiUnderTestUrl}${bookmarkId}`)
        .set('Authorization', adminBearerToken);

      expect(createdBookmarkResponse.statusCode).to.equal(HttpStatus.OK);
      createdBookmark = createdBookmarkResponse.body;
      expect(createdBookmark._id).to.equal(bookmarkId);
      expect(createdBookmark.name).to.equal(bookmarkExample.name);
      expect(createdBookmark.location).to.equal(bookmarkExample.location);

    });

    it('should find created bookmark by location', async function () {
      const response = await request(app)
        .get(baseApiUnderTestUrl)
        .query({location: createdBookmark.location})
        .set('Authorization', adminBearerToken);

      expect(response.statusCode).to.equal(HttpStatus.OK);
      expect(response.body.length).to.equal(1);
      const responseBookmark = response.body[0];
      expect(responseBookmark.location).to.equal(createdBookmark.location);

    });

    it('should find created bookmark by userId', async function () {
      const response = await request(app)
        .get(baseApiUnderTestUrl)
        .query({userId: createdBookmark.userId})
        .set('Authorization', adminBearerToken);

      expect(response.statusCode).to.equal(HttpStatus.OK);
      expect(response.body.length).to.equal(1);
      const responseBookmark = response.body[0];
      expect(responseBookmark.location).to.equal(createdBookmark.location);

    });

    it('should fail trying to add bookmark with existent location for same user', async function () {
      const response = await request(app)
        .post(`${baseApiUnderTestUrl}`)
        .set('Authorization', adminBearerToken)
        .send(bookmarkExample);

      expect(response.statusCode).to.equal(HttpStatus.CONFLICT);
      expect(response.body.message).to.equal(`Create: A public bookmark with this location is already present - location: ${bookmarkExample.location}`);
    });


    describe('invalid bookmark attributes at UPDATE', function () {

      it('should fail trying to UPDATE bookmark without a title', async function () {
        let bookmark_without_title = JSON.parse(JSON.stringify(createdBookmark));
        bookmark_without_title.name = '';

        const response = await request(app)
          .put(`${baseApiUnderTestUrl}${createdBookmark._id}`)
          .set('Authorization', adminBearerToken)
          .send(bookmark_without_title);

        expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
        expect(response.body.message).to.equal('The bookmark you submitted is not valid');
        expect(response.body.validationErrors).to.include('Missing required attribute - name');
      });


      it('should fail trying to UPDATE bookmark without a location', async function () {
        let bookmark_without_location = JSON.parse(JSON.stringify(createdBookmark));
        bookmark_without_location.location = '';

        const response = await request(app)
          .put(`${baseApiUnderTestUrl}${createdBookmark._id}`)
          .set('Authorization', adminBearerToken)
          .send(bookmark_without_location);

        expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
        expect(response.body.message).to.equal('The bookmark you submitted is not valid');
        expect(response.body.validationErrors).to.include('Missing required attribute - location');
      });

      it('should fail trying to UPDATE bookmark without userId', async function () {
        let bookmark_without_userid = JSON.parse(JSON.stringify(createdBookmark));
        bookmark_without_userid.userId = '';

        const response = await request(app)
          .put(`${baseApiUnderTestUrl}${createdBookmark._id}`)
          .set('Authorization', adminBearerToken)
          .send(bookmark_without_userid);

        expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
        expect(response.body.message).to.equal('The bookmark you submitted is not valid');
        expect(response.body.validationErrors).to.include('Missing required attribute - userId');
      });

      it('should fail trying to UPDATE bookmark without tags', async function () {
        let bookmark_without_tags = JSON.parse(JSON.stringify(createdBookmark));
        bookmark_without_tags.tags = [];

        const response = await request(app)
          .put(`${baseApiUnderTestUrl}${createdBookmark._id}`)
          .set('Authorization', adminBearerToken)
          .send(bookmark_without_tags);

        expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
        expect(response.body.message).to.equal('The bookmark you submitted is not valid');
        expect(response.body.validationErrors).to.include('Missing required attribute - tags');
      });

      it('should fail trying to UPDATE bookmark with too many tags', async function () {
        let bookmark_with_too_many_tags = JSON.parse(JSON.stringify(createdBookmark));
        bookmark_with_too_many_tags.tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9'];

        const response = await request(app)
          .put(`${baseApiUnderTestUrl}${createdBookmark._id}`)
          .set('Authorization', adminBearerToken)
          .send(bookmark_with_too_many_tags);

        expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
        expect(response.body.message).to.equal('The bookmark you submitted is not valid');
        expect(response.body.validationErrors).to.include('Too many tags have been submitted - max allowed 8');
      });

      it('should fail trying to UPDATE bookmark with a too big description', async function () {
        let invalidBookmark = JSON.parse(JSON.stringify(createdBookmark));
        const textSnippet = "long text in the making";
        let longText = textSnippet;
        for (var i = 0; i < 100; i++) {
          longText += textSnippet;
        }
        invalidBookmark.description = longText;

        const response = await request(app)
          .put(`${baseApiUnderTestUrl}${createdBookmark._id}`)
          .set('Authorization', adminBearerToken)
          .send(invalidBookmark);

        expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
        expect(response.body.message).to.equal('The bookmark you submitted is not valid');
        expect(response.body.validationErrors).to.include('The description is too long. Only ' + constants.MAX_NUMBER_OF_CHARS_FOR_DESCRIPTION + ' allowed');
      });

      it('should fail trying to UPDATE bookmark with a description with too many lines', async function () {
        let invalidBookmark = JSON.parse(JSON.stringify(createdBookmark));
        const line = "oneline\n";
        let longText = line;
        for (var i = 0; i < 101; i++) {
          longText += line;
        }
        invalidBookmark.description = longText;

        const response = await request(app)
          .put(`${baseApiUnderTestUrl}${createdBookmark._id}`)
          .set('Authorization', adminBearerToken)
          .send(invalidBookmark);

        expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
        expect(response.body.validationErrors).to.include('The description hast too many lines. Only ' + constants.MAX_NUMBER_OF_LINES_FOR_DESCRIPTION + ' allowed');
      });

    });


    it('should successfully UPDATE bookmark', async function () {
      let updatedBookmark = JSON.parse(JSON.stringify(createdBookmark));
      updatedBookmark.name += ' rocks';

      const updateBookmarkResponse = await request(app)
        .put(`${baseApiUnderTestUrl}${createdBookmark._id}`)
        .set('Authorization', adminBearerToken)
        .send(updatedBookmark);

      expect(updateBookmarkResponse.statusCode).to.equal(HttpStatus.OK);
      expect(updateBookmarkResponse.body.name).to.equal(bookmarkExample.name + ' rocks');

      //make also a read to be sure sure :P
      const readResponse = await request(app)
        .get(`${baseApiUnderTestUrl}${updatedBookmark._id}`)
        .set('Authorization', adminBearerToken);

      expect(readResponse.statusCode).to.equal(HttpStatus.OK);
      expect(readResponse.body.name).to.equal(bookmarkExample.name + ' rocks');
    });

    it('should succeed deleting created bookmark', async function () {
      const response = await request(app)
        .delete(`${baseApiUnderTestUrl}${createdBookmark._id}`)
        .set('Authorization', adminBearerToken);

      expect(response.statusCode).to.equal(HttpStatus.NO_CONTENT);
    });

    it('should succeed creating example bookmark and deleting it by location', async function () {
      const response = await request(app)
        .post(baseApiUnderTestUrl)
        .set('Authorization', adminBearerToken)
        .send(bookmarkExample);

      expect(response.statusCode).to.equal(HttpStatus.CREATED);
      const isLocationHeaderPresent = response.header['location'] !== undefined;
      expect(isLocationHeaderPresent).to.be.true;

      const deleteResponse = await request(app)
        .delete(`${baseApiUnderTestUrl}`)
        .query({location: bookmarkExample.location})
        .set('Authorization', adminBearerToken);

      expect(deleteResponse.statusCode).to.equal(HttpStatus.NO_CONTENT);

    });

    it('should succeed creating example bookmark and deleting it by userId', async function () {
      const createResponse = await request(app)
        .post(baseApiUnderTestUrl)
        .set('Authorization', adminBearerToken)
        .send(bookmarkExample);

      expect(createResponse.statusCode).to.equal(HttpStatus.CREATED);
      const isLocationHeaderPresent = createResponse.header['location'] !== undefined;
      expect(isLocationHeaderPresent).to.be.true;

      const deleteResponse = await request(app)
        .delete(`${baseApiUnderTestUrl}`)
        .query({userId: bookmarkExample.userId})
        .set('Authorization', adminBearerToken);

      expect(deleteResponse.statusCode).to.equal(HttpStatus.NO_CONTENT);
    });

    it('should succeed trying to delete non-existent bookmark', async function () {
      const response = await request(app)
        .delete(`${baseApiUnderTestUrl}`)
        .query({location: bookmarkExample.location})
        .set('Authorization', adminBearerToken);

      expect(response.statusCode).to.equal(HttpStatus.NO_CONTENT);
    });

    it('should succeed trying to delete non-existent bookmark', async function () {
      const response = await request(app)
        .delete(`${baseApiUnderTestUrl}`)
        .query({userId: bookmarkExample.userId})
        .set('Authorization', adminBearerToken);

      expect(response.statusCode).to.equal(HttpStatus.NO_CONTENT);
    });

  });

});
