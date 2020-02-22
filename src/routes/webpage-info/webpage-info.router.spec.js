const app = require('../../app');
const chai = require('chai');
const request = require('supertest');
const HttpStatus = require('http-status-codes/index');
const expect = chai.expect;

const common = require('../../common/config');
const config = common.config();

const superagent = require('superagent');

describe('Test scrape functionality', function () {

  const basePathApiWebPageInfo = '/api/webpage-info/';
  let bearerToken;

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

    } catch (err) {
      console.error('Error when getting user bearer token', err)
    }

  });

  it('should fail when trying to scrape with no query parameters', async function () {
    const response = await request(app)
      .get(basePathApiWebPageInfo + '/scrape')
      .set('Authorization', bearerToken);

    expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
    expect(response.body.message).to.equal('Missing parameters - url or youtubeVideoId');
    expect(response.body.validationErrors).to.include('You need to provide the url to scrape for or the youtubeVideoId');
  });

  it('should should fail trying to scrape without authorization', async function () {
    const response = await request(app)
      .get(basePathApiWebPageInfo + '/scrape')
      .query({location: 'https://www.bookmarks.dev'});

    expect(response.statusCode).to.equal(HttpStatus.FORBIDDEN);
  });

  it('should succeed scraping website', async function () {
    const response = await request(app)
      .get(basePathApiWebPageInfo + '/scrape')
      .query({location: 'https://www.bookmarks.dev'})
      .set('Authorization', bearerToken);

    expect(response.statusCode).to.equal(HttpStatus.OK);
    expect(response.body.title).to.equal('Dev Bookmarks');
    expect(response.body.metaDescription).to.contain('Bookmarking for Developers & Co');
  });
});

