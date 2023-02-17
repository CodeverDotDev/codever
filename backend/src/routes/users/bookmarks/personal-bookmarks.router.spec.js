const app = require('../../../app');

const request = require('supertest');
const HttpStatus = require('http-status-codes/index');

const constants = require('../../../common/constants');

let bearerToken;

let testUserId;
const baseApiUrlUnderTest = '/api/personal/users/';

let bookmarkExample;

const { toInclude} = require('jest-extended');
const { getTestUserId, getAccessToken, getBearerToken, getBookmarkId} = require("../../../common/testing/test.utils");
expect.extend({toInclude});

describe('Personal Bookmarks tests',  () => {

  beforeAll(async () => {
    try {
      const accessToken = await getAccessToken();
      bearerToken = getBearerToken(accessToken);
      testUserId = getTestUserId(accessToken);

      const bookmarkExampleLocation = "http://www.codepedia.org/personal-bookmarks-tests";
      bookmarkExample = {
        "name": "Cleaner code in NodeJs with async-await - Mongoose calls example – CodepediaOrg",
        "location": bookmarkExampleLocation,
        "language": "en",
        "tags": [
          "nodejs",
          "async-await",
          "mongoose",
          "mongodb"
        ],
        "publishedOn": "2017-11-05",
        "sourceCodeURL": "https://github.com/Codingpedia/bookmarks-api",
        "description": "Example showing migration of Mongoose calls from previously using callbacks to using the new async-await feature in NodeJs",
        "descriptionHtml": "<p>Example showing migration of Mongoose calls from previously using callbacks to using the new async-await feature in NodeJs</p>",
        "userId": testUserId,
        "public": true,
        "likeCount": 0,
        "lastAccessedAt": null
      }

      await request(app)
        .delete(`${baseApiUrlUnderTest}${testUserId}/bookmarks`)
        .query({'location': bookmarkExampleLocation})
        .set('Authorization', bearerToken);

    } catch (err) {
      console.error('Error when getting user bearer token', err)
    }

  });

  describe('invalid user id calls', function () {
    it('should fail trying to GET bookmarks with false user id', async function () {
      const response = await request(app)
        .get(baseApiUrlUnderTest + 'invalid_user_id/bookmarks')
        .set('Authorization', bearerToken);

      expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
    });

    it('should fail trying CREATE bookmark with invalid user id', async function () {

      const response = await request(app)
        .post(baseApiUrlUnderTest + 'invalid_user_id/bookmarks')
        .set('Authorization', bearerToken)
        .send(bookmarkExample);

      expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);

    });

    it('should fail trying to UPDATE bookmark with invalid user id', async function () {
      const response = await request(app)
        .put(baseApiUrlUnderTest + 'invalid_user_id/bookmarks/1324343')
        .set('Authorization', bearerToken)
        .send(bookmarkExample);

      expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
    });

    it('should fail trying to DELETE bookmark with invalid user id', async function () {
      const response = await request(app)
        .delete(baseApiUrlUnderTest + 'invalid_user_id/bookmarks/12343434')
        .set('Authorization', bearerToken);
      expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('invalid bookmark attributes at CREATION', function () {
    it('should fail trying to CREATE bookmark without a name', async function () {
      let invalidBookmark = JSON.parse(JSON.stringify(bookmarkExample));
      invalidBookmark.name = '';

      const response = await request(app)
        .post(`${baseApiUrlUnderTest}${testUserId}/bookmarks`)
        .set('Authorization', bearerToken)
        .send(invalidBookmark);

      expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toEqual('The bookmark you submitted is not valid');
      expect(response.body.validationErrors).toInclude('Missing required attribute - name');
    });

    it('should fail trying to CREATE bookmark without a location', async function () {
      let invalidBookmark = JSON.parse(JSON.stringify(bookmarkExample));
      invalidBookmark.location = '';

      const response = await request(app)
        .post(`${baseApiUrlUnderTest}${testUserId}/bookmarks`)
        .set('Authorization', bearerToken)
        .send(invalidBookmark);

      expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toEqual('The bookmark you submitted is not valid');
      expect(response.body.validationErrors).toInclude('Missing required attribute - location');
    });

    it('should fail trying to CREATE bookmark without tags', async function () {
      let invalidBookmark = JSON.parse(JSON.stringify(bookmarkExample));
      invalidBookmark.tags = [];

      const response = await request(app)
        .post(`${baseApiUrlUnderTest}${testUserId}/bookmarks`)
        .set('Authorization', bearerToken)
        .send(invalidBookmark)

      expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toEqual('The bookmark you submitted is not valid');
      expect(response.body.validationErrors).toInclude('Missing required attribute - tags');
    });

    it('should fail trying to CREATE bookmark with too many tags', async function () {
      let invalidBookmark = JSON.parse(JSON.stringify(bookmarkExample));
      invalidBookmark.tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9'];

      const response = await request(app)
        .post(`${baseApiUrlUnderTest}${testUserId}/bookmarks`)
        .set('Authorization', bearerToken)
        .send(invalidBookmark);

      expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toEqual('The bookmark you submitted is not valid');
      expect(response.body.validationErrors).toInclude('Too many tags have been submitted - max allowed 8');
    });

    it('should fail trying to CREATE bookmark with blocked tags', async function () {
      let invalidBookmark = JSON.parse(JSON.stringify(bookmarkExample));
      invalidBookmark.tags = ['tag1', 'tag2', 'tag3', 'tag4', 'awesome', 'awesome-java'];

      const response = await request(app)
        .post(`${baseApiUrlUnderTest}${testUserId}/bookmarks`)
        .set('Authorization', bearerToken)
        .send(invalidBookmark);

      expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toEqual('The bookmark you submitted is not valid');
      expect(response.body.validationErrors).toInclude('The following tags are blocked: awesome awesome-java');
    });

    it('should fail trying to CREATE bookmark with a too big description', async function () {
      let invalidBookmark = JSON.parse(JSON.stringify(bookmarkExample));
      const textSnippet = "long text in the making";
      let longText = textSnippet;
      for ( var i = 0; i < 500; i++ ) {
        longText += textSnippet;
      }
      invalidBookmark.description = longText;

      const response = await request(app)
        .post(`${baseApiUrlUnderTest}${testUserId}/bookmarks`)
        .set('Authorization', bearerToken)
        .send(invalidBookmark)

      expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toEqual('The bookmark you submitted is not valid');
      expect(response.body.validationErrors).toInclude('The description is too long. Only ' + constants.MAX_NUMBER_OF_CHARS_FOR_DESCRIPTION + ' allowed');
    });

    it('should fail trying to CREATE bookmark with a description with too many lines', async function () {
      let invalidBookmark = JSON.parse(JSON.stringify(bookmarkExample));
      const line = "oneline\n";
      let longText = line;
      for ( var i = 0; i < 1001; i++ ) {
        longText += line;
      }
      invalidBookmark.description = longText;

      const response = await request(app)
        .post(`${baseApiUrlUnderTest}${testUserId}/bookmarks`)
        .set('Authorization', bearerToken)
        .send(invalidBookmark);

      expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
      expect(response.body.message).toEqual('The bookmark you submitted is not valid');
      expect(response.body.validationErrors).toInclude('The description hast too many lines. Only ' + constants.MAX_NUMBER_OF_LINES_FOR_DESCRIPTION + ' allowed');
    });

  });

  describe('inexistent bookmark id tests', function () {
    it('should fail trying to update inexistent bookmark', async function () {
      let inexistentBookmarkId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .put(`${baseApiUrlUnderTest}${testUserId}/bookmarks/${inexistentBookmarkId}`)
        .set('Authorization', bearerToken)
        .send(bookmarkExample);

      expect(response.statusCode).toEqual(HttpStatus.NOT_FOUND);
      expect(response.body.message).toEqual(`Bookmark NOT_FOUND with id: ${inexistentBookmarkId} AND location: ${bookmarkExample.location}`);
    });

    it('should fail trying to delete inexistent bookmark', async function () {
      let inexistentBookmarkId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`${baseApiUrlUnderTest}${testUserId}/bookmarks/${inexistentBookmarkId}`)
        .set('Authorization', bearerToken);

      expect(response.statusCode).toEqual(HttpStatus.NOT_FOUND);
      expect(response.body.message).toEqual(`Bookmark NOT_FOUND with id: ${inexistentBookmarkId}`);
    });

  });

  describe('test successful creation, update and deletion of bookmark', function () {

    let createdBookmark;

    it('should succeed creating example bookmark', async function () {
      const response = await request(app)
        .post(`${baseApiUrlUnderTest}${testUserId}/bookmarks`)
        .set('Authorization', bearerToken)
        .send(bookmarkExample);

      expect(response.statusCode).toEqual(HttpStatus.CREATED);
      const locationHeaderValue = response.header['location']
      const isLocationHeaderPresent = response.header['location'] !== undefined;
      expect(isLocationHeaderPresent).toBe(true);

      //set the id of the bookmarkexample now that it is created
      const lastSlashIndex = locationHeaderValue.lastIndexOf('/');
      const bookmarkId = locationHeaderValue.substring(lastSlashIndex + 1);

      const bookmarkResponse = await request(app)
        .get(`${baseApiUrlUnderTest}${testUserId}/bookmarks/${bookmarkId}`)
        .set('Authorization', bearerToken);

      expect(bookmarkResponse.statusCode).toEqual(HttpStatus.OK);
      createdBookmark = bookmarkResponse.body;
      expect(createdBookmark._id).toEqual(bookmarkId);
      expect(createdBookmark.name).toEqual(bookmarkExample.name);
      expect(createdBookmark.location).toEqual(bookmarkExample.location);

    });

    it('should fail trying to add bookmark with existent location for same user', async function () {
      const response = await request(app)
        .post(`${baseApiUrlUnderTest}${testUserId}/bookmarks`)
        .set('Authorization', bearerToken)
        .send(bookmarkExample)

      expect(response.statusCode).toEqual(HttpStatus.CONFLICT);
      expect(response.body.message).toEqual(`Create: A public bookmark with this location is already present - location: ${bookmarkExample.location}`);
    });

    describe('invalid bookmark attributes at UPDATE', function () {
      it('should fail trying to UPDATE bookmark without a title', async function () {
        let bookmarkWithoutName = JSON.parse(JSON.stringify(createdBookmark));
        bookmarkWithoutName.name = '';

        const response = await request(app)
          .put(`${baseApiUrlUnderTest}${testUserId}/bookmarks/${createdBookmark._id}`)
          .set('Authorization', bearerToken)
          .send(bookmarkWithoutName);

        expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
        expect(response.body.validationErrors).toInclude('Missing required attribute - name');
      });

      it('should fail trying to UPDATE bookmark without a location', async function () {
        let bookmarkWithoutLocation = JSON.parse(JSON.stringify(createdBookmark));
        bookmarkWithoutLocation.location = '';

        const response = await request(app)
          .put(`${baseApiUrlUnderTest}${testUserId}/bookmarks/${createdBookmark._id}`)
          .set('Authorization', bearerToken)
          .send(bookmarkWithoutLocation);

        expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
        expect(response.body.validationErrors).toInclude('Missing required attribute - location');
      });

      it('should fail trying to UPDATE bookmark without tags', async function () {
        let bookmarkWithoutTags = JSON.parse(JSON.stringify(createdBookmark));
        bookmarkWithoutTags.tags = [];
        const response = await request(app)
          .put(`${baseApiUrlUnderTest}${testUserId}/bookmarks/${createdBookmark._id}`)
          .set('Authorization', bearerToken)
          .send(bookmarkWithoutTags);

        expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
        expect(response.body.validationErrors).toInclude('Missing required attribute - tags');
      });

      it('should fail trying to UPDATE bookmark with too many tags', async function () {
        let bookmarkWithTooManyTags = JSON.parse(JSON.stringify(createdBookmark));
        bookmarkWithTooManyTags.tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9'];

        const response = await request(app)
          .put(`${baseApiUrlUnderTest}${testUserId}/bookmarks/${createdBookmark._id}`)
          .set('Authorization', bearerToken)
          .send(bookmarkWithTooManyTags);

        expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
        expect(response.body.validationErrors).toInclude('Too many tags have been submitted - max allowed 8');
      });

      it('should fail trying to UPDATE bookmark with blocked tags', async function () {
        let bookmarkWithBlockedTags = JSON.parse(JSON.stringify(createdBookmark));
        bookmarkWithBlockedTags.tags = ['tag1', 'tag2', 'tag3', 'awesome', 'awesome-java'];

        const response = await request(app)
          .put(`${baseApiUrlUnderTest}${testUserId}/bookmarks/${createdBookmark._id}`)
          .set('Authorization', bearerToken)
          .send(bookmarkWithBlockedTags);

        expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
        expect(response.body.validationErrors).toInclude('The following tags are blocked: awesome awesome-java');
      });

      it('should fail trying to UPDATE bookmark with a too big description', async function () {
        let bookmarkWithTooBigDescription = JSON.parse(JSON.stringify(createdBookmark));
        const textSnippet = "long text in the making";
        let longText = textSnippet;
        for ( var i = 0; i < 500; i++ ) {
          longText += textSnippet;
        }
        bookmarkWithTooBigDescription.description = longText;

        const response = await request(app)
          .put(`${baseApiUrlUnderTest}${testUserId}/bookmarks/${createdBookmark._id}`)
          .set('Authorization', bearerToken)
          .send(bookmarkWithTooBigDescription);

        expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
        expect(response.body.validationErrors).toInclude('The description is too long. Only ' + constants.MAX_NUMBER_OF_CHARS_FOR_DESCRIPTION + ' allowed');
      });

      it('should fail trying to UPDATE bookmark with a description with too many lines', async function () {
        let bookmarkWithDescriptionWithTooManyLines = JSON.parse(JSON.stringify(createdBookmark));
        const line = "oneline\n";
        let longText = line;
        for ( var i = 0; i < 1001; i++ ) {
          longText += line;
        }
        bookmarkWithDescriptionWithTooManyLines.description = longText;

        const response = await request(app)
          .put(`${baseApiUrlUnderTest}${testUserId}/bookmarks/${createdBookmark._id}`)
          .set('Authorization', bearerToken)
          .send(bookmarkWithDescriptionWithTooManyLines);

        expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
        expect(response.body.validationErrors).toInclude('The description hast too many lines. Only ' + constants.MAX_NUMBER_OF_LINES_FOR_DESCRIPTION + ' allowed');
      });

    });

    it('should successfully UPDATE bookmark', async function () {
      let updatedBookmark = JSON.parse(JSON.stringify(createdBookmark));
      updatedBookmark.name += ' rocks';

      const updateResponse = await request(app)
        .put(`${baseApiUrlUnderTest}${testUserId}/bookmarks/${updatedBookmark._id}`)
        .set('Authorization', bearerToken)
        .send(updatedBookmark);

      expect(updateResponse.statusCode).toEqual(HttpStatus.OK);
      expect(updateResponse.body.name).toEqual(bookmarkExample.name + ' rocks');

      //make also a read to be sure sure :P
      const readUpdatedResponse = await request(app)
        .get(`${baseApiUrlUnderTest}${testUserId}/bookmarks/${updatedBookmark._id}`)
        .set('Authorization', bearerToken);

      expect(readUpdatedResponse.statusCode).toEqual(HttpStatus.OK);
      expect(readUpdatedResponse.body.name).toEqual(bookmarkExample.name + ' rocks');

    });

    it('should succeed deleting created bookmark', async function () {
      const response = await request(app)
        .delete(`${baseApiUrlUnderTest}${testUserId}/bookmarks/${createdBookmark._id}`)
        .set('Authorization', bearerToken);

      expect(response.statusCode).toEqual(HttpStatus.NO_CONTENT);
    });

  });

  describe('Personal bookmarks - test search functionality',  () => {

    let basePathApiPersonalUsersBookmarks;
    let createdBookmarkId;

    const verySpecialTitle = "very special title very-special-java-title - personal bookmarks search";
    const verySpecialLocation = "http://www.very-special-url.com/personal-bookmarks.spec.js";
    const verySpecialTag = "very-special-tag-personal-bookmarks";
    const verySpecialSourceCodeUrl = "https://very-special-github-url.com/personal-bookmarks-search";

    let bookmarkExample = {
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
      "sourceCodeURL": verySpecialSourceCodeUrl,
      "description": "This is a very special bookmark used for testing the search functionality. Indeed very-special-bookmark",
      "descriptionHtml": "<p>This is a very special bookmark used for testing the search functionality. Indeed very-special-bookmark</p>",
      "userId": testUserId,
      "public": false,
      "likeCount": 0,
      "lastAccessedAt": null
    }

    beforeAll(async () => {

      basePathApiPersonalUsersBookmarks = '/api/personal/users/' + testUserId + '/bookmarks/'; //it has to be initialised here otherwiese "testUserId" is undefined, variables are called


      try {
        await request(app)
          .delete(basePathApiPersonalUsersBookmarks)
          .query({'location': verySpecialLocation})
          .set('Authorization', bearerToken);

        const response = await request(app)
          .post(basePathApiPersonalUsersBookmarks)
          .set('Authorization', bearerToken)
          .send(bookmarkExample);
        createdBookmarkId = getBookmarkId(response)
      } catch (err) {
        console.error('Failed to create sample bookmark to look for ', err);
        throw err;
      }

      const userData = {
        userId: testUserId,
        searches: [],
        readLater: [],
        likes: [],
        watchedTags: [],
        ignoredTags: [],
        pinned: [],
        favorites: [],
        history: [],
      }

      const createUserDataResponse = await request(app)
        .post('/api/personal/users/' + testUserId)
        .set('Authorization', bearerToken)
        .send(userData);

      if ( createUserDataResponse.statusCode !== HttpStatus.CREATED ) {
        throw new Error("Sample personal bookmark not properly created");
      }

    });

    afterAll(async () => {
      await request(app)
        .delete(`${basePathApiPersonalUsersBookmarks}/${createdBookmarkId}`)
        .set('Authorization', bearerToken);

      await request(app)
        .delete('/api/personal/users/' + testUserId)
        .set('Authorization', bearerToken);
    });

    it('should NOT find bookmark with very-special-tag-personal-bookmarks in query param as tag and word - private:only and wrong lang:de', async function () {
      const queryText = `${verySpecialTag} [${verySpecialTag}] private:only lang:de`;
      const response = await request(app)
        .get(basePathApiPersonalUsersBookmarks)
        .set('Authorization', bearerToken)
        .query({q: queryText})
        .query({limit: 10});

      expect(response.statusCode).toEqual(HttpStatus.OK);
      const filteredBookmarks = response.body;
      expect(filteredBookmarks.length).toEqual(0);
    });


    test.each([
      [`${verySpecialTag}`],
      [`${verySpecialTag} lang:en site:${bookmarkExample.location}`],
      [`${verySpecialTag} [${verySpecialTag}]`],
      [`${verySpecialTag} [${verySpecialTag}] private:only lang:en`],
      [`${verySpecialTag} [${verySpecialTag}] private:only`],
      [`[${verySpecialTag}] private:only`],
      [`${verySpecialTag} private:only`],
      [`${verySpecialTag} site:${bookmarkExample.location}`],
      [`${verySpecialTag} lang:en`],
      [`${bookmarkExample.location}`],
      [`${verySpecialSourceCodeUrl}`],
      [`${verySpecialTitle}`],
      [`[${verySpecialTag}]`],
      [`${verySpecialTag} [${verySpecialTag}]`],
    ])('given query %p it should find expected bookmark', async (query) => {
      const response = await request(app)
        .get(basePathApiPersonalUsersBookmarks)
        .set('Authorization', bearerToken)
        .query({q: query})
        .query({limit: 10});
      expect(response.statusCode).toEqual(HttpStatus.OK);
      const filteredBookmarks = response.body;
      expect(filteredBookmarks.length).toEqual(1);
      const foundBookmark = filteredBookmarks[0];
      expect(foundBookmark.name).toEqual(bookmarkExample.name);
      expect(foundBookmark.userId).toEqual(testUserId);
      expect(foundBookmark.location).toEqual(bookmarkExample.location);
    });

  });

});
