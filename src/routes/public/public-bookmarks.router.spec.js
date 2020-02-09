const app = require('../../app');
const chai = require('chai');
const request = require('supertest');
const HttpStatus = require('http-status-codes/index');
const expect = chai.expect;
const jwt = require('jsonwebtoken');

const common = require('../../common/config');
const config = common.config();

const superagent = require('superagent');

describe('Public API Tests', function () {

  const basePathApiPublicBookmarks = '/api/public/bookmarks/';

  describe('get public bookmarks root endpoint tests', function () {
    const publicBookmarksApiBaseUrl = '/api/public/bookmarks';

    it('should return all public bookmarks', async function () {
      const response = await request(app)
        .get(basePathApiPublicBookmarks);

      expect(response.statusCode).to.equal(HttpStatus.OK);
    });

    it('should not find bookmark by location', async function () {
      const response = await request(app)
        .get(basePathApiPublicBookmarks)
        .query({location: 'unknown-url'});

      expect(response.statusCode).to.equal(HttpStatus.NOT_FOUND);
    });
  });

  describe('Test search functionality', function () {

    let bearerToken;
    let createdBookmarkId;

    let testUserId;
    const basePathApiPersonalUsers = '/api/personal/users/';

    const verySpecialTitle = "very special title very-special-java-title - public";
    const verySpecialLocation = "http://www.very-special-url.com/public-api-tests";
    const verySpecialTag = "very-special-tag-public";
    const verySpecialSourceCodeUrl = "https://very-special-github-url.com/public-api-tests";
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
          "likes": 0,
          "lastAccessedAt": null
        }

        try {
          await request(app)
            .delete(`${basePathApiPersonalUsers}${testUserId}/bookmarks`)
            .query({'location': verySpecialLocation})
            .set('Authorization', bearerToken);

          const createBookmarkResponse = await request(app)
            .post(`${basePathApiPersonalUsers}${testUserId}/bookmarks`)
            .set('Authorization', bearerToken)
            .send(bookmarkExample);

          if (createBookmarkResponse.statusCode !== HttpStatus.CREATED) {
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

    it('should find bookmark by location query param', async function () {
      const response = await request(app)
        .get(basePathApiPublicBookmarks)
        .query({location: verySpecialLocation});

      expect(response.statusCode).to.equal(HttpStatus.OK);
    });

    it('should find bookmark tagged with very-special-tag', async function () {
      const response = await request(app)
        .get(basePathApiPublicBookmarks + 'tagged/' + verySpecialTag);

      expect(response.statusCode).to.equal(HttpStatus.OK);
      const filteredBookmarks = response.body;
      const foundBookmark = filteredBookmarks[0];
      expect(filteredBookmarks.length).to.equal(1);
      expect(foundBookmark.name).to.equal(verySpecialTitle);
    });

    it('should find bookmark with with very-special-tag in query param as word', async function () {
      const response = await request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: verySpecialTag})
        .query({limit: 10});

      expect(response.statusCode).to.equal(HttpStatus.OK);
      const filteredBookmarks = response.body;
      const foundBookmark = filteredBookmarks[0];
      expect(filteredBookmarks.length).to.equal(1);
      expect(foundBookmark.name).to.equal(verySpecialTitle);
    });

    it('should find bookmark with with very-special-tag in query param as word and language', async function () {
      const response = await request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: `${verySpecialTag} lang:en`})
        .query({limit: 10});

      expect(response.statusCode).to.equal(HttpStatus.OK);
      const filteredBookmarks = response.body;
      const foundBookmark = filteredBookmarks[0];
      expect(filteredBookmarks.length).to.equal(1);
      expect(foundBookmark.name).to.equal(verySpecialTitle);
    });

    it('should NOT find bookmark with with very-special-tag in query param as word and false language', async function () {
      const queryText = `${verySpecialTag} lang:de`;
      const response = await request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: queryText})
        .query({limit: 10});

      expect(response.statusCode).to.equal(HttpStatus.OK);
      const filteredBookmarks = response.body;
      expect(filteredBookmarks.length).to.equal(0);
    });

    it('should find bookmark with with very-special-tag in query param as word and site', async function () {
      const queryText = `${verySpecialTag} site:very-special-url.com`;
      const response = await request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: queryText})
        .query({limit: 10});

      expect(response.statusCode).to.equal(HttpStatus.OK);
      const filteredBookmarks = response.body;
      const foundBookmark = filteredBookmarks[0];
      expect(filteredBookmarks.length).to.equal(1);
      expect(foundBookmark.name).to.equal(verySpecialTitle);
    });


    it('should find bookmark with with very-special-tag in query param as word plus language and site', async function () {
      const queryText = `${verySpecialTag} lang:en site:very-special-url.com`;
      const response = await request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: queryText})
        .query({limit: 10});

      expect(response.statusCode).to.equal(HttpStatus.OK);
      const filteredBookmarks = response.body;
      const foundBookmark = filteredBookmarks[0];
      expect(filteredBookmarks.length).to.equal(1);
      expect(foundBookmark.name).to.equal(verySpecialTitle);
    });


    it('should NOT find bookmark with with very-special-tag in query param as word and false site', async function () {
      const queryText = `${verySpecialTag} site:not-existing-domain.com`;
      const response = await request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: queryText})
        .query({limit: 10});

      expect(response.statusCode).to.equal(HttpStatus.OK);
      const filteredBookmarks = response.body;
      expect(filteredBookmarks.length).to.equal(0);
    });

    it('should find bookmark with with very-special-tag in query param as word and user', async function () {
      const queryText = `${verySpecialTag} user:${testUserId}`
      const response = await request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: queryText})
        .query({limit: 10});

      expect(response.statusCode).to.equal(HttpStatus.OK);
      const filteredBookmarks = response.body;
      const foundBookmark = filteredBookmarks[0];
      expect(filteredBookmarks.length).to.equal(1);
      expect(foundBookmark.name).to.equal(verySpecialTitle);
    });

    it('should find bookmark with with very-special-tag in query param only as tag', async function () {
      const response = await request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: `[${verySpecialTag}]`})
        .query({limit: 10});

      expect(response.statusCode).to.equal(HttpStatus.OK);
      const filteredBookmarks = response.body;
      const foundBookmark = filteredBookmarks[0];
      expect(filteredBookmarks.length).to.equal(1);
      expect(foundBookmark.name).to.equal(verySpecialTitle);
    });

    it('should find bookmark with with very-special-tag in query param only as tag and user', async function () {
      const queryText = `[${verySpecialTag}] user:${testUserId}`
      const response = await request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: queryText})
        .query({limit: 10});

      expect(response.statusCode).to.equal(HttpStatus.OK);
      const filteredBookmarks = response.body;
      const foundBookmark = filteredBookmarks[0];
      expect(filteredBookmarks.length).to.equal(1);
      expect(foundBookmark.name).to.equal(verySpecialTitle);
    });

    it('should find bookmark with with very-special-tag in query param as tag and word', async function () {
      const response = await request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: `${verySpecialTag} [${verySpecialTag}]`})
        .query({limit: 10});

      expect(response.statusCode).to.equal(HttpStatus.OK);
      const filteredBookmarks = response.body;
      const foundBookmark = filteredBookmarks[0];
      expect(filteredBookmarks.length).to.equal(1);
      expect(foundBookmark.name).to.equal(verySpecialTitle);
    });

    it('should find bookmark with with very-special-tag in query param as tag and word plus user', async function () {
      const queryText = `${verySpecialTag} [${verySpecialTag}] user:${testUserId}`;
      const response = await request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: queryText})
        .query({limit: 10});

      expect(response.statusCode).to.equal(HttpStatus.OK);
      const filteredBookmarks = response.body;
      const foundBookmark = filteredBookmarks[0];
      expect(filteredBookmarks.length).to.equal(1);
      expect(foundBookmark.name).to.equal(verySpecialTitle);
    });

    it(`should find bookmark with special title - ${verySpecialTitle} `, async function () {
      const response = await request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: `${verySpecialTitle}`})
        .query({limit: 10});

      expect(response.statusCode).to.equal(HttpStatus.OK);
      const filteredBookmarks = response.body;
      const foundBookmark = filteredBookmarks[0];
      expect(filteredBookmarks.length).to.equal(1);
      expect(foundBookmark.name).to.equal(verySpecialTitle);
    });

    it(`should find bookmark with special source code url title - ${verySpecialSourceCodeUrl} `, async function () {
      const response = await request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: `${verySpecialSourceCodeUrl}`})
        .query({limit: 10});

      expect(response.statusCode).to.equal(HttpStatus.OK);
      const filteredBookmarks = response.body;
      const foundBookmark = filteredBookmarks[0];
      expect(filteredBookmarks.length).to.equal(1);
      expect(foundBookmark.name).to.equal(verySpecialTitle);
    });

    it(`should find bookmark with special location - ${verySpecialLocation} `, async function () {
      const response = await request(app)
        .get(basePathApiPublicBookmarks)
        .query({q: `${verySpecialLocation}`})
        .query({limit: 10});

      expect(response.statusCode).to.equal(HttpStatus.OK);
      const filteredBookmarks = response.body;
      const foundBookmark = filteredBookmarks[0];
      expect(filteredBookmarks.length).to.equal(1);
      expect(foundBookmark.name).to.equal(verySpecialTitle);
    });

  });

  describe('Test scrape functionality', function () {
    it('should fail when trying to scrape with no query parameters', async function () {
      const response = await request(app)
        .get(basePathApiPublicBookmarks + '/scrape');

      expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
      expect(response.body.message).to.equal('Missing parameters - url or youtubeVideoId');
      expect(response.body.validationErrors).to.include('You need to provide the url to scrape for or the youtubeVideoId');
    });

    it('should succeed scraping website', async function () {
      const response = await request(app)
        .get(basePathApiPublicBookmarks + '/scrape')
        .query({location: 'https://www.bookmarks.dev'});

      expect(response.statusCode).to.equal(HttpStatus.OK);
      expect(response.body.title).to.equal('Dev Bookmarks');
      expect(response.body.metaDescription).to.contain('Bookmarking for Developers & Co');
    });
  });

});
