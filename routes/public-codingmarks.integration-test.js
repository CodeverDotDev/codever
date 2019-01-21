var app = require('../app');
var chai = require('chai');
var request = require('supertest');
var HttpStatus = require('http-status-codes');
var expect = chai.expect;

describe('Public API Tests', function() {
  it('should return the latest codingmarks - without query parameters', function(done) {
    request(app)
      .get('/api/public/codingmarks/latest-entries')
      .end(function(err, res) {
        expect(res.statusCode).to.equal(200);
        done();
      });
  });

 it('should return the latest codingmarks - "since" parameter', function(done) {
    let oneMonthBeforeNow = new Date();
    oneMonthBeforeNow.setMonth(oneMonthBeforeNow.getMonth()-1);
    request(app)
      .get('/api/public/codingmarks/latest-entries')
      .query({since: oneMonthBeforeNow.getTime()})
      .end(function(err, res) {
        //expect(res.statusCode).to.be.equal.to(200);
        expect(res.statusCode).to.equal(200);
        //expect(res.statusCode).to.equal(HttpStatus.OK);
        done();
      });
  });

  it('should return the latest codingmarks - "since" and "to" parameter', function(done) {
      let sevenDaysBeforeNow = new Date();
      sevenDaysBeforeNow.setDate(sevenDaysBeforeNow.getDate() - 7);

      let twoDaysBeforeNow = new Date();
      twoDaysBeforeNow.setDate(twoDaysBeforeNow.getDate() - 7);

      request(app)
        .get('/api/public/codingmarks/latest-entries')
        .query({since: sevenDaysBeforeNow.getTime()})
        .query({to: twoDaysBeforeNow.getTime()})
        .end(function(err, res) {
          expect(res.statusCode).to.equal(HttpStatus.OK);
          done();
        });
    });

    it('should return bad request - invalid "since" and "to" parameter', function(done) {
      let sevenDaysBeforeNow = new Date();
      sevenDaysBeforeNow.setDate(sevenDaysBeforeNow.getDate() - 7);

      let twoDaysBeforeNow = new Date();
      twoDaysBeforeNow.setDate(twoDaysBeforeNow.getDate() - 2);

      request(app)
        .get('/api/public/codingmarks/latest-entries')
        .query({since: twoDaysBeforeNow.getTime()})
        .query({to: sevenDaysBeforeNow.getTime()})
        .end(function(err, res) {
          expect(res.statusCode).to.equal(HttpStatus.BAD_REQUEST);
          done();
        });
    });
});
