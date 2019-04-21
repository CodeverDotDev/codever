var app = require('../../app');
var chai = require('chai');
var request = require('supertest');
var HttpStatus = require('http-status-codes');
var expect = chai.expect;

const common = require('../../common/config');
const config = common.config();

const superagent = require('superagent');

/**
 * Order of tests is important (example user will be first created/updated to eventually be deleted)
 */
describe('User Data tests', function () {

  let bearerToken;
  const testUserId = config.integration_tests.test_user_id;
  const baseApiUrlUnderTest = '/api/personal/users';

  const starredBookmarkId = "bookmarkid-3443";

  const searchTextExample= 'nodejs rocks';
  const userExample = {
    "userId": config.integration_tests.test_user_id,
    "searches": [
      {
        "text": searchTextExample,
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
      .get(baseApiUrlUnderTest + '/false_user_id')
      .set('Authorization', bearerToken)
      .end(function (error, response) {
        expect(response.statusCode).to.equal(HttpStatus.UNAUTHORIZED);
        done();
      });
  });

  it('should fail trying to GET data for unexisting user', function (done) {
    request(app)
      .get(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken)
      .end(function (error, response) {
        expect(response.statusCode).to.equal(HttpStatus.NOT_FOUND);
        done();
      });
  });

  it('should fail trying to UPDATE user without userId in the body', function (done) {
    let invalidUser = JSON.parse(JSON.stringify(userExample));
    delete invalidUser.userId;
    request(app)
      .put(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken)
      .end(function (error, response) {
        expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
        expect(response.body.title).to.equal('Missing or invalid userId in the request body');
        done();
      });
  });

  it('should fail trying to UPDATE with invalid user Id in the body', function (done) {
    let invalidUser = JSON.parse(JSON.stringify(userExample));
    invalidUser.userId = 'invalid_user_id';
    request(app)
      .put(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken)
      .end(function (error, response) {
        expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
        expect(response.body.title).to.equal('Missing or invalid userId in the request body');
        done();
      });
  });

  it('should successfully CREATE example user without searches', function (done) {
    let newUser = JSON.parse(JSON.stringify(userExample));
    newUser.searches = [];

    request(app)
      .put(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken)
      .send(newUser)
      .end(function (error, response) {
        expect(response.statusCode).to.equal(HttpStatus.OK);
        expect(response.body.userId).to.equal(testUserId);
        expect(response.body.searches.length).to.equal(0);
        done();
      });
  });

  it('should fail trying to UPDATE example user with invalid searches', function (done) {
    let userWithInvalidSearches = JSON.parse(JSON.stringify(userExample));
    userWithInvalidSearches.searches.push({"text": "", "lastAccessedAt": "2019-01-28T05:47:47.652Z"});
    request(app)
      .put(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken)
      .send(userWithInvalidSearches)
      .end(function (error, response) {
        expect(response.statusCode).to.equal(HttpStatus.BAD_REQUEST);
        expect(response.body.title).to.equal('Searches are not valid');
        done();
      });
  });

  it('should successfully UPDATE example user with searches', function (done) {
    request(app)
      .put(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken)
      .send(userExample)
      .end(function (error, response) {
        expect(response.statusCode).to.equal(HttpStatus.OK);
        expect(response.body.userId).to.equal(testUserId);
        expect(response.body.searches).to.have.lengthOf(1);
        expect(response.body.searches[0].text).to.equal(searchTextExample);
        done();
      });
  });

  it('should successfully UPDATE example user new starred bookmark', function (done) {
    let userExampleWithStars = JSON.parse(JSON.stringify(userExample));
    userExampleWithStars.stars = [starredBookmarkId];

    request(app)
      .put(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken)
      .send(userExampleWithStars)
      .end(function (error, response) {
        expect(response.statusCode).to.equal(HttpStatus.OK);
        expect(response.body.userId).to.equal(testUserId);
        expect(response.body.stars).to.have.lengthOf(1);
        expect(response.body.stars[0]).to.equal(starredBookmarkId);
        done();
      });
  });

  it('should now successfully READ created/updated user', function (done) {
    request(app)
      .get(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken)
      .end(function (error, response) {
        expect(response.statusCode).to.equal(HttpStatus.OK);
        expect(response.body.userId).to.equal(testUserId);
        expect(response.body.searches).to.have.lengthOf(1);
        expect(response.body.searches[0].text).to.equal(searchTextExample);
        expect(response.body.stars[0]).to.equal(starredBookmarkId);

        done();
      });
  });

  it('should succeed to DELETE the new created user', function (done) {
    request(app)
      .delete(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken)
      .end(function (error, response) {
        expect(response.statusCode).to.equal(HttpStatus.NO_CONTENT);
        done();
      });
  });


  it('should fail trying to DELETE the already deleted user', function (done) {
    request(app)
      .delete(`${baseApiUrlUnderTest}/${testUserId}`)
      .set('Authorization', bearerToken)
      .end(function (error, response) {
        expect(response.statusCode).to.equal(HttpStatus.NOT_FOUND);
        done();
      });
  });


});
