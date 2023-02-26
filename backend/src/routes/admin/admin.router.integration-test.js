const app = require('../../app');
const request = require('supertest');
const HttpStatus = require('http-status-codes/index');


const common = require('../../common/config');
const config = common.config();
const constants = require('../../common/constants');

const superagent = require('superagent');

const {toInclude} = require('jest-extended');
expect.extend({toInclude});

describe('Admin API Tests',  () => {

  let adminBearerToken;
  const baseApiUnderTestUrl = '/api/admin/bookmarks/';

  let bookmarkExample;
  const bookmarkExampleLocation = "http://www.codepedia.org/ama/admin-api-tests";

  beforeAll(async () => {

    //set admin bearer token
    const response = await superagent
      .post(config.integration_tests.token_endpoint)
      .send('client_id=' + 'bookmarks')
      .send('username=' + 'admin-integration-tests')//TODO change me
      .send('password=' + 'admin-integration-tests')
      .send('grant_type=password')
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
      "sourceCodeURL": "https://github.com/CodeverDotDev/codever",
      "description": "Example showing migration of Mongoose calls from previously using callbacks to using the new async-await feature in NodeJs",
      "descriptionHtml": "<p>Example showing migration of Mongoose calls from previously using callbacks to using the new async-await feature in NodeJs</p>",
      "userId": "some-user-id-for-admin-api-tests",
      "public": true,
      "likeCount": 0,
      "lastAccessedAt": null
    }
  });

  describe('Get bookmarks functionality',  () => {

    it('should find some bookmarks', async () => {
      const response = await request(app)
        .get(baseApiUnderTestUrl)
        .set('Authorization', adminBearerToken);

      expect(response.statusCode).toEqual(HttpStatus.OK);
      const bookmarks = response.body;
      expect(bookmarks.length).toBeGreaterThan(1);
    });


    it('should find some public bookmarks', async function () {
      const response = await request(app)
        .get(baseApiUnderTestUrl)
        .set('Authorization', adminBearerToken)
        .query({public: true}); //difference to previous test

      expect(response.statusCode).toEqual(HttpStatus.OK);
      const bookmarks = response.body;
      expect(bookmarks.length).toBeGreaterThan(1);

    });

  });

  describe('get latest bookmarks function tests', function () {
    const latestEntriesApiBaseUrl = baseApiUnderTestUrl + 'latest-entries';

    it('should return the latest bookmarks - without query parameters', async function () {
      const response = await request(app)
        .get(latestEntriesApiBaseUrl)
        .set('Authorization', adminBearerToken);

      expect(response.statusCode).toEqual(HttpStatus.OK);
    });

    it('should return the latest bookmarks - "since" parameter', async function () {
      let oneMonthBeforeNow = new Date();
      oneMonthBeforeNow.setMonth(oneMonthBeforeNow.getMonth() - 1);

      const response = await request(app)
        .get(latestEntriesApiBaseUrl)
        .query({since: oneMonthBeforeNow.getTime()})
        .set('Authorization', adminBearerToken);

      expect(response.statusCode).toEqual(HttpStatus.OK);
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

      expect(response.statusCode).toEqual(HttpStatus.OK);
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

      expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
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

      expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toEqual('The bookmark you submitted is not valid');
      expect(response.body.validationErrors).toInclude('Missing required attribute - name');
    });

    it('should fail trying to CREATE bookmark without a userId', async function () {
      let bookmarkdWithoutUserId = JSON.parse(JSON.stringify(bookmarkExample));
      bookmarkdWithoutUserId.userId = '';

      const response = await request(app)
        .post(`${baseApiUnderTestUrl}`)
        .set('Authorization', adminBearerToken)
        .send(bookmarkdWithoutUserId);

      expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toEqual('The bookmark you submitted is not valid');
      expect(response.body.validationErrors).toInclude('Missing required attribute - userId');
    });

    it('should fail trying to CREATE bookmark without a location', async function () {
      let bookmarkWithoutLocation = JSON.parse(JSON.stringify(bookmarkExample));
      bookmarkWithoutLocation.location = '';

      const response = await request(app)
        .post(`${baseApiUnderTestUrl}`)
        .set('Authorization', adminBearerToken)
        .send(bookmarkWithoutLocation);

      expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toEqual('The bookmark you submitted is not valid');
      expect(response.body.validationErrors).toInclude('Missing required attribute - location');
    });

    it('should fail trying to CREATE bookmark without tags', async function () {
      let bookmarkWithoutTags = JSON.parse(JSON.stringify(bookmarkExample));
      bookmarkWithoutTags.tags = [];

      const response = await request(app)
        .post(`${baseApiUnderTestUrl}`)
        .set('Authorization', adminBearerToken)
        .send(bookmarkWithoutTags);

      expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toEqual('The bookmark you submitted is not valid');
      expect(response.body.validationErrors).toInclude('Missing required attribute - tags');
    });

    it('should fail trying to CREATE bookmark with too many tags', async function () {
      let bookmark_with_too_many_tags = JSON.parse(JSON.stringify(bookmarkExample));
      bookmark_with_too_many_tags.tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9'];

      const response = await request(app)
        .post(`${baseApiUnderTestUrl}`)
        .set('Authorization', adminBearerToken)
        .send(bookmark_with_too_many_tags);

      expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toEqual('The bookmark you submitted is not valid');
      expect(response.body.validationErrors).toInclude('Too many tags have been submitted - max allowed 8');
    });

  });

  describe('admin - test successful creation, update and deletion of bookmark', function () {

    let createdBookmark;

    beforeAll(async function () {
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

      expect(response.statusCode).toEqual(HttpStatus.CREATED);
      const locationHeaderValue = response.header['location']
      const isLocationHeaderPresent = response.header['location'] !== undefined;
      expect(isLocationHeaderPresent).toBeTruthy();

      //set the id of the bookmarkexample now that it is created
      const lastSlashIndex = locationHeaderValue.lastIndexOf('/');
      const bookmarkId = locationHeaderValue.substring(lastSlashIndex + 1);

      const createdBookmarkResponse = await request(app)
        .get(`${baseApiUnderTestUrl}${bookmarkId}`)
        .set('Authorization', adminBearerToken);

      expect(createdBookmarkResponse.statusCode).toEqual(HttpStatus.OK);
      createdBookmark = createdBookmarkResponse.body;
      expect(createdBookmark._id).toEqual(bookmarkId);
      expect(createdBookmark.name).toEqual(bookmarkExample.name);
      expect(createdBookmark.location).toEqual(bookmarkExample.location);

    });

    it('should find created bookmark by location', async function () {
      const response = await request(app)
        .get(baseApiUnderTestUrl)
        .query({location: createdBookmark.location})
        .set('Authorization', adminBearerToken);

      expect(response.statusCode).toEqual(HttpStatus.OK);
      expect(response.body.length).toEqual(1);
      const responseBookmark = response.body[0];
      expect(responseBookmark.location).toEqual(createdBookmark.location);

    });

    it('should find created bookmark by userId', async function () {
      const response = await request(app)
        .get(baseApiUnderTestUrl)
        .query({userId: createdBookmark.userId})
        .set('Authorization', adminBearerToken);

      expect(response.statusCode).toEqual(HttpStatus.OK);
      expect(response.body.length).toEqual(1);
      const responseBookmark = response.body[0];
      expect(responseBookmark.location).toEqual(createdBookmark.location);

    });

    it('should fail trying to add bookmark with existent location for same user', async function () {
      const response = await request(app)
        .post(`${baseApiUnderTestUrl}`)
        .set('Authorization', adminBearerToken)
        .send(bookmarkExample);

      expect(response.statusCode).toEqual(HttpStatus.CONFLICT);
      expect(response.body.message).toEqual(`Create: A public bookmark with this location is already present - location: ${bookmarkExample.location}`);
    });


    describe('invalid bookmark attributes at UPDATE', function () {

      it('should fail trying to UPDATE bookmark without a title', async function () {
        let bookmark_without_title = JSON.parse(JSON.stringify(createdBookmark));
        bookmark_without_title.name = '';

        const response = await request(app)
          .put(`${baseApiUnderTestUrl}${createdBookmark._id}`)
          .set('Authorization', adminBearerToken)
          .send(bookmark_without_title);

        expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
        expect(response.body.message).toEqual('The bookmark you submitted is not valid');
        expect(response.body.validationErrors).toInclude('Missing required attribute - name');
      });


      it('should fail trying to UPDATE bookmark without a location', async function () {
        let bookmark_without_location = JSON.parse(JSON.stringify(createdBookmark));
        bookmark_without_location.location = '';

        const response = await request(app)
          .put(`${baseApiUnderTestUrl}${createdBookmark._id}`)
          .set('Authorization', adminBearerToken)
          .send(bookmark_without_location);

        expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
        expect(response.body.message).toEqual('The bookmark you submitted is not valid');
        expect(response.body.validationErrors).toInclude('Missing required attribute - location');
      });

      it('should fail trying to UPDATE bookmark without userId', async function () {
        let bookmark_without_userid = JSON.parse(JSON.stringify(createdBookmark));
        bookmark_without_userid.userId = '';

        const response = await request(app)
          .put(`${baseApiUnderTestUrl}${createdBookmark._id}`)
          .set('Authorization', adminBearerToken)
          .send(bookmark_without_userid);

        expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
        expect(response.body.message).toEqual('The bookmark you submitted is not valid');
        expect(response.body.validationErrors).toInclude('Missing required attribute - userId');
      });

      it('should fail trying to UPDATE bookmark without tags', async function () {
        let bookmark_without_tags = JSON.parse(JSON.stringify(createdBookmark));
        bookmark_without_tags.tags = [];

        const response = await request(app)
          .put(`${baseApiUnderTestUrl}${createdBookmark._id}`)
          .set('Authorization', adminBearerToken)
          .send(bookmark_without_tags);

        expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
        expect(response.body.message).toEqual('The bookmark you submitted is not valid');
        expect(response.body.validationErrors).toInclude('Missing required attribute - tags');
      });

      it('should fail trying to UPDATE bookmark with too many tags', async function () {
        let bookmark_with_too_many_tags = JSON.parse(JSON.stringify(createdBookmark));
        bookmark_with_too_many_tags.tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9'];

        const response = await request(app)
          .put(`${baseApiUnderTestUrl}${createdBookmark._id}`)
          .set('Authorization', adminBearerToken)
          .send(bookmark_with_too_many_tags);

        expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
        expect(response.body.message).toEqual('The bookmark you submitted is not valid');
        expect(response.body.validationErrors).toInclude('Too many tags have been submitted - max allowed 8');
      });

    });


    it('should successfully UPDATE bookmark', async function () {
      let updatedBookmark = JSON.parse(JSON.stringify(createdBookmark));
      updatedBookmark.name += ' rocks';

      const updateBookmarkResponse = await request(app)
        .put(`${baseApiUnderTestUrl}${createdBookmark._id}`)
        .set('Authorization', adminBearerToken)
        .send(updatedBookmark);

      expect(updateBookmarkResponse.statusCode).toEqual(HttpStatus.OK);
      expect(updateBookmarkResponse.body.name).toEqual(bookmarkExample.name + ' rocks');

      //make also a read to be sure sure :P
      const readResponse = await request(app)
        .get(`${baseApiUnderTestUrl}${updatedBookmark._id}`)
        .set('Authorization', adminBearerToken);

      expect(readResponse.statusCode).toEqual(HttpStatus.OK);
      expect(readResponse.body.name).toEqual(bookmarkExample.name + ' rocks');
    });

    it('should succeed deleting created bookmark', async function () {
      const response = await request(app)
        .delete(`${baseApiUnderTestUrl}${createdBookmark._id}`)
        .set('Authorization', adminBearerToken);

      expect(response.statusCode).toEqual(HttpStatus.NO_CONTENT);
    });

    it('should succeed creating example bookmark and deleting it by location', async function () {
      const response = await request(app)
        .post(baseApiUnderTestUrl)
        .set('Authorization', adminBearerToken)
        .send(bookmarkExample);

      expect(response.statusCode).toEqual(HttpStatus.CREATED);
      const isLocationHeaderPresent = response.header['location'] !== undefined;
      expect(isLocationHeaderPresent).toBeTruthy();

      const deleteResponse = await request(app)
        .delete(`${baseApiUnderTestUrl}`)
        .query({location: bookmarkExample.location})
        .set('Authorization', adminBearerToken);

      expect(deleteResponse.statusCode).toEqual(HttpStatus.NO_CONTENT);

    });

    it('should succeed creating example bookmark and deleting it by userId', async function () {
      const createResponse = await request(app)
        .post(baseApiUnderTestUrl)
        .set('Authorization', adminBearerToken)
        .send(bookmarkExample);

      expect(createResponse.statusCode).toEqual(HttpStatus.CREATED);
      const isLocationHeaderPresent = createResponse.header['location'] !== undefined;
      expect(isLocationHeaderPresent).toBeTruthy();

      const deleteResponse = await request(app)
        .delete(`${baseApiUnderTestUrl}`)
        .query({userId: bookmarkExample.userId})
        .set('Authorization', adminBearerToken);

      expect(deleteResponse.statusCode).toEqual(HttpStatus.NO_CONTENT);
    });

    it('should succeed trying to delete non-existent bookmark', async function () {
      const response = await request(app)
        .delete(`${baseApiUnderTestUrl}`)
        .query({location: bookmarkExample.location})
        .set('Authorization', adminBearerToken);

      expect(response.statusCode).toEqual(HttpStatus.NO_CONTENT);
    });

    it('should succeed trying to delete non-existent bookmark', async function () {
      const response = await request(app)
        .delete(`${baseApiUnderTestUrl}`)
        .query({userId: bookmarkExample.userId})
        .set('Authorization', adminBearerToken);

      expect(response.statusCode).toEqual(HttpStatus.NO_CONTENT);
    });

  });

});
