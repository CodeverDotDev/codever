var app = require('../app');
var chai = require('chai');
var request = require('supertest');
var HttpStatus = require('http-status-codes');
var expect = chai.expect;

const common = require('../common/config');
const config = common.config();

const superagent = require('superagent');

describe('Secured Public API Tests', function () {

  let bearerToken;
  const ratingTestUserId = config.integration_tests.test_user_id;
  const baseApiUrlUnderTest = '/api/secured/public/codingmarks/';

  before(function(done) {
    superagent
      .post(config.integration_tests.token_endpoint)
      .send('client_id=' + config.integration_tests.client_id)
      .send('client_secret=' + config.integration_tests.client_secret)
      .send('grant_type=client_credentials')
      .set('Accept', 'application/json')
      .then(res => {
        bearerToken = 'Bearer ' + res.body.access_token;
        done();
      });

  });

  describe('patch codingmark tests', function () {
    let codingmarkUnderTest;

    before(function(done) {
      superagent
        .get(config.basicApiUrl + 'public/codingmarks')
        .query({location: 'https://www.codingmarks.org'})
        .set('Accept', 'application/json')
        .then(res => {
            codingmarkUnderTest = res.body;
            done();
        });

    });

    it('should fail trying to rate with invalid userId', function (done) {

      request(app)
        .patch(baseApiUrlUnderTest + codingmarkUnderTest._id)
        .set('Authorization', bearerToken)
        .send({action: 'UNSTAR'})
        .send({ratingUserId: 'blablabla'})
        .end(function (err, res) {
          console.log(res.statusCode);
          expect(res.statusCode).to.equal(HttpStatus.UNAUTHORIZED);
          done();
        });
    });


    it('should fail trying to rate with invalid patching action', function (done) {
      request(app)
        .patch(baseApiUrlUnderTest + codingmarkUnderTest._id)
        .set('Authorization', bearerToken)
        .send({action: 'STARR'})
        .send({ratingUserId: ratingTestUserId})
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          done();
        });
    });

    it('should fail trying to rate (STAR) a non-existing codingmark', function (done) {
      const inexistentCodingmarkId = '507f191e810c19729de860aa';
      request(app)
        .patch(baseApiUrlUnderTest + inexistentCodingmarkId)
        .set('Authorization', bearerToken)
        .send({action: 'STAR'})
        .send({ratingUserId: ratingTestUserId})
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.NOT_FOUND);
          done();
        });
    });

    it('should fail trying to rate (UNSTAR) a non-existing codingmark', function (done) {
      const inexistentCodingmarkId = '507f191e810c19729de860aa';
      request(app)
        .patch(baseApiUrlUnderTest + inexistentCodingmarkId)
        .set('Authorization', bearerToken)
        .send({action: 'UNSTAR'})
        .send({ratingUserId: ratingTestUserId})
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.NOT_FOUND);
          done();
        });
    });

    it('should fail trying to rate with incomplete request attributes - action', function (done) {
      const inexistentCodingmarkId = '507f191e810c19729de860aa';
      request(app)
        .patch(baseApiUrlUnderTest + codingmarkUnderTest._id)
        .set('Authorization', bearerToken)
        .send({ratingUserId: ratingTestUserId})
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          done();
        });
    });


    it('should star codingmark ', function (done) {
      request(app)
        .patch(baseApiUrlUnderTest + codingmarkUnderTest._id)
        .set('Authorization', bearerToken)
        .send({action: 'STAR'})
        .send({ratingUserId: ratingTestUserId})
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.OK);
          request(app)
            .get('/api/public/codingmarks/' + codingmarkUnderTest._id)
            .end(function (err, res) {
              expect(res.statusCode).to.equal(HttpStatus.OK);
              expect(res.body.starredBy).to.be.an('array').that.does.include(ratingTestUserId);
              done();
            });
        });
    });

    it('should unstar codingmark ', function (done) {
      request(app)
        .patch(baseApiUrlUnderTest + codingmarkUnderTest._id)
        .set('Authorization', bearerToken)
        .send({action: 'UNSTAR'})
        .send({ratingUserId: ratingTestUserId})
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.OK);
          request(app)
            .get('/api/public/codingmarks/' + codingmarkUnderTest._id)
            .end(function (err, res) {
              expect(res.statusCode).to.equal(HttpStatus.OK);
              expect(res.body.starredBy).to.be.an('array').that.does.not.include(ratingTestUserId);
              done();
            });
        });
    });

  });

});
