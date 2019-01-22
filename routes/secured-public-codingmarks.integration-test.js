var app = require('../app');
var chai = require('chai');
var request = require('supertest');
var HttpStatus = require('http-status-codes');
var expect = chai.expect;

const common = require('../common/config');
const config = common.config();

const superagent = require('superagent');

describe('Secured Public API Tests', function () {
  const latestEntriesApiBaseUrl = '/api/secured/public/codingmarks';
  let bearerToken;

  before(function() {
    superagent
      .post(config.integration_tests.token_endpoint)
      .send('client_id=' + config.integration_tests.client_id)
      .send('client_secret=' + config.integration_tests.client_secret)
      .send('grant_type=client_credentials')
      .set('Accept', 'application/json')
      .then(res => {
        bearerToken = 'Bearer ' + res.body.access_token;
      });

  });

  describe('patch codingmark tests', function () {
    let codingmarkToPatch;

    before(function() {
      superagent
        .get('http://localhost:3000/api/public/codingmarks')
        .query({location: 'https://www.codingmarks.org'})
        .set('Accept', 'application/json')
        .then(res => {
            codingmarkToPatch = res.body;
        });

    });

    it('should fail trying to rate with invalid userId', function (done) {
      request(app)
        .patch('/api/secured/public/codingmarks/' + codingmarkToPatch.id)
        .set('Authorization', bearerToken)
          .send({action: 'UNSTAR'})
          .send({ratingUserId: 'blablabla'})
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.UNAUTHORIZED);
          codingmarkToPatch = res.body;
          done();
        });
    });


    it('should fail trying to rate with invalid patching action', function (done) {
      request(app)
        .patch('/api/secured/public/codingmarks/' + codingmarkToPatch.id)
        .set('Authorization', bearerToken)
        .send({action: 'STARR'})
        .send({ratingUserId: 'blablabla'})//TODO replace with correct userId
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.UNAUTHORIZED);
          done();
        });
    });

    it('should fail trying to rate (STAR) a non-existing codingmark', function (done) {
      const inexistentCodingmarkId = '507f191e810c19729de860aa';
      request(app)
        .patch('/api/secured/public/codingmarks/' + inexistentCodingmarkId)
        .set('Authorization', bearerToken)
        .send({action: 'STAR'})
        .send({ratingUserId: 'blablabla'})//TODO replace with correct userId
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.NOT_FOUND);
          done();
        });
    });

    it('should fail trying to rate (UNSTAR) a non-existing codingmark', function (done) {
      const inexistentCodingmarkId = '507f191e810c19729de860aa';
      request(app)
        .patch('/api/secured/public/codingmarks/' + inexistentCodingmarkId)
        .set('Authorization', bearerToken)
        .send({action: 'UNSTAR'})
        .send({ratingUserId: 'blablabla'})//TODO replace with correct userId
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.NOT_FOUND);
          done();
        });
    });

    it('should fail trying to rate with incomlete request attributes - here ratingUserId', function (done) {
      const inexistentCodingmarkId = '507f191e810c19729de860aa';
      request(app)
        .patch('/api/secured/public/codingmarks/' + inexistentCodingmarkId)
        .set('Authorization', bearerToken)
        .send({action: 'STAR'})
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          done();
        });
    });

    it('should star codingmark ', function (done) {
      const inexistentCodingmarkId = '507f191e810c19729de860aa';
      request(app)
        .patch('/api/secured/public/codingmarks/' + inexistentCodingmarkId)
        .set('Authorization', bearerToken)
        .send({action: 'STAR'})
        .send({ratingUserId: 'blablabla'})//TODO replace with correct userId
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.OK);
          done();
        });
    });

    it('should verify codingmark is starred by the user', function (done) {
      request(app)
        .get('/api/public/codingmarks' + codingmarkToPatch.id)
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.OK);
          expect(res.body.starredBy).contains
          done();
        });
    });

    it('should unstar codingmark ', function (done) {
      request(app)
        .patch('/api/secured/public/codingmarks/' + inexistentCodingmarkId)
        .set('Authorization', bearerToken)
        .send({action: 'UNSTAR'})
        .send({ratingUserId: 'blablabla'})//TODO replace with correct userId
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.OK);
          done();
        });
    });

  });


});
