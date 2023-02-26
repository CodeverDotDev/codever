const app = require('../../app');
const request = require('supertest');
const HttpStatus = require('http-status-codes/index');

const common = require('../../common/config');
const config = common.config();

const superagent = require('superagent');

const {toInclude} = require('jest-extended');
expect.extend({toInclude});

describe('Test scrape functionality',  () => {

  const basePathApiWebPageInfo = '/api/webpage-info/';
  let bearerToken;

  beforeAll(async () => {
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

    expect(response.statusCode).toEqual(HttpStatus.BAD_REQUEST);
    expect(response.body.message).toEqual('Missing parameters - url or youtubeVideoId');
    expect(response.body.validationErrors).toInclude('You need to provide the url to scrape for or the youtubeVideoId');
  });

  it('should should fail trying to scrape without authorization', async function () {
    const response = await request(app)
      .get(basePathApiWebPageInfo + '/scrape')
      .query({location: 'https://www.codever.dev'});

    expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
  });

  it('should succeed scraping website', async function () {
    const response = await request(app)
      .get(basePathApiWebPageInfo + '/scrape')
      .query({location: 'https://www.codever.dev'})
      .set('Authorization', bearerToken);

    expect(response.statusCode).toEqual(HttpStatus.OK);
    expect(response.body.title).toEqual('Codever');
    expect(response.body.metaDescription).toInclude('Open source Bookmarks and Code Snippets Manager for Developers & Co');
  });
});

