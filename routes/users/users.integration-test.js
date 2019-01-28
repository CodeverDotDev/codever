var app = require('../../app');
var chai = require('chai');
var request = require('supertest');
var HttpStatus = require('http-status-codes');
var expect = chai.expect;

const common = require('../../common/config');
const config = common.config();

const superagent = require('superagent');

describe('Personal Codingmarks CRUD operations', function () {

  let bearerToken;
  const testUserId = config.integration_tests.test_user_id;
  const baseApiUrlUnderTest = '/api/personal/users/';

  const userExample = {
    "userId": config.integration_tests.test_user_id,
    "searches": [
      {
        "text": "mongodb indexes",
        "lastAccessedAt": "2019-01-28T05:47:47.652Z"
      }
    ]
  }

  before(function (done) {

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

  it('should fail trying to GET user details with invalid user id', function (done) {
    request(app)
      .get(baseApiUrlUnderTest + 'false_user_id')
      .set('Authorization', bearerToken)
      .end(function (error, response) {
        expect(response.statusCode).to.equal(HttpStatus.UNAUTHORIZED);
        done();
      });
  });

  it('should fail trying to GET data for unexisting user', function (done) {
    request(app)
      .get(baseApiUrlUnderTest + testUserId)
      .set('Authorization', bearerToken)
      .end(function (error, response) {
        expect(response.statusCode).to.equal(HttpStatus.NOT_FOUND);
        done();
      });
  });

/*  it('should fail trying to UPDATE user without userId in the body', function (done) {
    let invalidUser = JSON.parse(JSON.stringify(userExample));
    invalidUser.userId = '';
    request(app)
      .put(baseApiUrlUnderTest + testUserId)
      .set('Authorization', bearerToken)
      .end(function (error, response) {
        expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
        expect(response.body.title).to.equal('Missing required attributes');
        done();
      });
  });*/


});
