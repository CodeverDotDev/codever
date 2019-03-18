var app = require('../app');
var chai = require('chai');
var request = require('supertest');

var expect = chai.expect;

describe('API Tests root', function() {
  it('should return link to swagger documentation', function(done) {
    request(app)
      .get('/api')
      .end(function(err, res) {
        expect(res.statusCode).to.equal(200);
        expect(res.text).to.equal('API Backend supporting Bookmarks.dev - <a href="/api/docs">Swagger Docs</a>');
        done();
      });
  });
});
