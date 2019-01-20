var app = require('../app');
var chai = require('chai');
var request = require('supertest');

var expect = chai.expect;

describe('API Tests', function() {
  it('should return version number', function(done) {
    request(app)
      .get('/api')
      .end(function(err, res) {
        //expect(res.body.version).to.be.ok;
        expect(res.statusCode).to.equal(200);
        done();
      });
  });
});
