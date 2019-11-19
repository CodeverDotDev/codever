const app = require('../../app');
const chai = require('chai');
const request = require('supertest');

const expect = chai.expect;

describe('API Tests - version', function() {
  it('should return response with version', function(done) {
    request(app)
      .get('/api/version')
      .end(function(err, res) {
        expect(res.body.gitSha1).to.be.ok;
        expect(res.body.version).to.exist;
        expect(res.statusCode).to.equal(200);
        done();
      });
  });
});
