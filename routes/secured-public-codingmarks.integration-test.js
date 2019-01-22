var app = require('../app');
var chai = require('chai');
var request = require('supertest');
var HttpStatus = require('http-status-codes');
var expect = chai.expect;

const superagent = require('superagent');

describe('Secured Public API Tests', function () {
  const latestEntriesApiBaseUrl = '/api/secured/public/codingmarks';
  let bearerToken;

  before(function() {
    superagent
      .post('http://localhost:8380/auth/realms/codingpedia/protocol/openid-connect/token')
      .send('client_id=integration-tests-service-account')
      .send('client_secret=df6e389e-e20c-47fd-b12c-fa02d029689b')
      .send('grant_type=client_credentials')
      .set('Accept', 'application/json')
      .then(res => {
        console.log(res.body);
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
          console.log(res.body);
        });

    });

    it('should find the codingmark by location', function (done) {
      request(app)
        .get('/api/public/codingmarks')
        .query({location: 'https://www.codingmarks.org'})
        .end(function (err, res) {
          expect(res.statusCode).to.equal(HttpStatus.OK);
          codingmarkToPatch = res.body;
          done();
        });
    });
  });


});
